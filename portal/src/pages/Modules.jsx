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
  Tooltip,
  Stack,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  Skeleton,
  InputBase,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  AddRounded as AddIcon,
  EditRounded as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  CloseRounded as CloseIcon,
  CloudUploadRounded as UploadIcon,
  SearchRounded as SearchIcon,
  CategoryOutlined as CategoryIcon,
  Inventory2Outlined as ProductIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  ChevronRightRounded as ChevronRightIcon,
  FilterListRounded as FilterListIcon,
  RefreshRounded as RefreshIcon,
  VisibilityOutlined as ViewIcon,
  CheckCircleRounded as CheckCircleIcon,
  CancelRounded as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import moduleService from '../services/moduleService';
import vendorService from '../services/vendorService';
import { useColorMode } from '../theme/ThemeContext';

const Modules = () => {
  const { BRAND, isDark } = useColorMode();
  const navigate = useNavigate();

  // Core Data State
  const [modules, setModules] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Dialog & Drawer States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    active: true,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const [modulesRes, productsRes] = await Promise.allSettled([
        moduleService.getAllModules(),
        vendorService.getAllProducts(),
      ]);

      if (modulesRes.status === 'fulfilled') {
        setModules(modulesRes.value?.data || []);
      } else {
        throw new Error(modulesRes.reason?.message || 'Failed to fetch categories/modules');
      }

      if (productsRes.status === 'fulfilled') {
        setProducts(productsRes.value?.data || []);
      }
    } catch (err) {
      console.error('Error loading category data:', err);
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Map products count per category/module
  const categoryProductsMap = useMemo(() => {
    const map = {};
    if (!Array.isArray(products)) return map;

    products.forEach((p) => {
      if (!p) return;
      const modId = p.module_id?._id || p.module_id || p.module?._id || p.module;
      if (!modId) return;
      map[modId] = (map[modId] || 0) + 1;
    });

    return map;
  }, [products]);

  // Open Form
  const handleOpenFormDialog = (module = null) => {
    if (module) {
      setSelectedModule(module);
      setFormData({
        name: module.name || '',
        active: module.active !== undefined ? module.active : true,
        image: null,
      });
      setImagePreview(module.image || null);
    } else {
      setSelectedModule(null);
      setFormData({
        name: '',
        active: true,
        image: null,
      });
      setImagePreview(null);
    }
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedModule(null);
    setImagePreview(null);
  };

  const handleOpenViewDrawer = (module) => {
    setSelectedModule(module);
    setViewDrawerOpen(true);
  };

  const handleCloseViewDrawer = () => {
    setViewDrawerOpen(false);
    setSelectedModule(null);
  };

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
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
        throw new Error('Category name is required.');
      }

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('active', formData.active);

      if (formData.image) {
        data.append('image', formData.image);
      }

      if (selectedModule) {
        await moduleService.updateModule(selectedModule._id, data);
        setSuccess('Category updated successfully!');
      } else {
        await moduleService.createModule(data);
        setSuccess('Category created successfully!');
      }

      handleCloseFormDialog();
      loadAllData(true);
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (module) => {
    setSelectedModule(module);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await moduleService.deleteModule(selectedModule._id);
      setSuccess('Category deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedModule(null);
      loadAllData(true);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.message || 'Failed to delete category.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Logic
  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || m.name?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && m.active) ||
        (statusFilter === 'INACTIVE' && !m.active);

      return matchesSearch && matchesStatus;
    });
  }, [modules, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredModules.length / rowsPerPage));
  const paginatedModules = filteredModules.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const activeCount = modules.filter((m) => m.active).length;
  const inactiveCount = modules.filter((m) => !m.active).length;

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
            Categories & Modules
          </Typography>
          <Typography
            sx={{
              color: BRAND.muted,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              fontWeight: 500,
              mt: 0.2,
            }}
          >
            Organize marketplace category verticals, storefront badges and navigation
          </Typography>
        </Box>
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
          + Add Category
        </Button>
      </Box>

      {/* ======================================================== */}
      {/* 2. SUMMARY FILTER TABS */}
      {/* ======================================================== */}
      <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mb: 2.5 }}>
        {[
          { label: 'All Categories', value: modules.length, filter: 'ALL', bg: BRAND.lightGreen, color: BRAND.green, active: statusFilter === 'ALL' },
          { label: 'Active', value: activeCount, filter: 'ACTIVE', bg: isDark ? 'rgba(16,185,129,0.18)' : '#DCFCE7', color: '#10B981', active: statusFilter === 'ACTIVE' },
          { label: 'Inactive', value: inactiveCount, filter: 'INACTIVE', bg: BRAND.redLight, color: BRAND.red, active: statusFilter === 'INACTIVE' },
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
              backgroundColor: tab.active ? (isDark ? 'rgba(16,185,129,0.18)' : tab.bg) : BRAND.white,
              color: tab.active ? tab.color : BRAND.muted,
              border: `1px solid ${tab.active ? tab.color + '40' : BRAND.border}`,
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'all 0.15s ease',
              boxShadow: tab.active ? '0 2px 6px rgba(0,0,0,0.03)' : 'none',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : tab.bg,
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
                backgroundColor: tab.active ? `${tab.color}25` : BRAND.innerCard,
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
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
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
              Category Directory
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted, mt: 0.2 }}>
              {filteredModules.length} {filteredModules.length === 1 ? 'category' : 'categories'} configured
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
            {/* Search */}
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
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
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

            {/* Refresh */}
            <Tooltip title="Refresh categories">
              <IconButton
                size="small"
                onClick={() => loadAllData(true)}
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
            <Table size="small" sx={{ minWidth: 700 }}>
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
                  <TableCell>Category</TableCell>
                  <TableCell align="center">Products Count</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4} sx={{ py: 1.6 }}>
                        <Skeleton variant="text" width="100%" height={32} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedModules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                      <CategoryIcon sx={{ fontSize: 44, color: BRAND.muted, mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography sx={{ color: BRAND.text, fontWeight: 700, fontSize: '14px' }}>
                        No categories found
                      </Typography>
                      <Typography sx={{ color: BRAND.muted, fontSize: '12px', mt: 0.3, mb: 1.5 }}>
                        {searchQuery || statusFilter !== 'ALL'
                          ? 'No categories match your search or filter.'
                          : 'Create your first marketplace category to get started.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedModules.map((module) => {
                    const count = categoryProductsMap[module._id] || 0;

                    return (
                      <TableRow
                        key={module._id}
                        hover
                        sx={{
                          '& td': { borderBottom: `1px solid ${BRAND.border}`, py: 1.3 },
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: BRAND.tableHover },
                          transition: 'background-color 0.12s ease',
                        }}
                      >
                        {/* Category Info */}
                        <TableCell onClick={() => handleOpenViewDrawer(module)}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={module.image}
                              alt={module.name}
                              variant="rounded"
                              sx={{
                                width: 38,
                                height: 38,
                                borderRadius: '8px',
                                backgroundColor: BRAND.lightGreen,
                                color: BRAND.green,
                                border: `1px solid ${BRAND.border}`,
                              }}
                            >
                              <CategoryIcon sx={{ fontSize: 20 }} />
                            </Avatar>
                            <Typography sx={{ fontWeight: 700, fontSize: '13px', color: BRAND.text }}>
                              {module.name}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Products Count */}
                        <TableCell align="center" onClick={() => handleOpenViewDrawer(module)}>
                          <Tooltip title="View category products">
                            <Chip
                              icon={<ProductIcon sx={{ fontSize: '13px !important', color: count > 0 ? `${BRAND.green} !important` : `${BRAND.muted} !important` }} />}
                              label={`${count} ${count === 1 ? 'product' : 'products'}`}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '11px',
                                backgroundColor: count > 0 ? BRAND.lightGreen : BRAND.innerCard,
                                color: count > 0 ? BRAND.green : BRAND.muted,
                                borderRadius: '6px',
                                height: 24,
                              }}
                            />
                          </Tooltip>
                        </TableCell>

                        {/* Status */}
                        <TableCell onClick={() => handleOpenViewDrawer(module)}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.2,
                              py: 0.3,
                              borderRadius: '50px',
                              backgroundColor: module.active ? BRAND.lightGreen : BRAND.redLight,
                              color: module.active ? BRAND.green : BRAND.red,
                              fontSize: '11.5px',
                              fontWeight: 700,
                            }}
                          >
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: module.active ? BRAND.green : BRAND.red }} />
                            {module.active ? 'Active' : 'Inactive'}
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="View Category">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenViewDrawer(module)}
                                sx={{
                                  color: BRAND.blue,
                                  backgroundColor: BRAND.lightBlue,
                                  borderRadius: '8px',
                                  width: 28,
                                  height: 28,
                                  '&:hover': { opacity: 0.8 },
                                }}
                              >
                                <ViewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Edit Category">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenFormDialog(module)}
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

                            <Tooltip title="Delete Category">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(module)}
                                sx={{
                                  color: BRAND.red,
                                  backgroundColor: BRAND.redLight,
                                  borderRadius: '8px',
                                  width: 28,
                                  height: 28,
                                  '&:hover': { opacity: 0.8 },
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
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
            [1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: '12px' }} />)
          ) : paginatedModules.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CategoryIcon sx={{ fontSize: 36, color: BRAND.muted, display: 'block', mx: 'auto', mb: 1 }} />
              <Typography sx={{ color: BRAND.muted, fontSize: '13px' }}>No categories found</Typography>
            </Box>
          ) : (
            paginatedModules.map((module) => {
              const count = categoryProductsMap[module._id] || 0;

              return (
                <Paper
                  key={module._id}
                  elevation={0}
                  onClick={() => handleOpenViewDrawer(module)}
                  sx={{
                    p: 1.8,
                    borderRadius: '12px',
                    backgroundColor: BRAND.innerCard,
                    border: `1px solid ${BRAND.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Avatar
                        src={module.image}
                        alt={module.name}
                        variant="rounded"
                        sx={{ width: 36, height: 36, borderRadius: '8px', border: `1px solid ${BRAND.border}` }}
                      >
                        <CategoryIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '13px', color: BRAND.text }}>
                          {module.name}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                          {count} {count === 1 ? 'product' : 'products'}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={module.active ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{
                        bgcolor: module.active ? BRAND.lightGreen : BRAND.redLight,
                        color: module.active ? BRAND.green : BRAND.red,
                        fontWeight: 700,
                        height: 20,
                        fontSize: '10.5px',
                      }}
                    />
                  </Box>
                </Paper>
              );
            })
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
            borderTop: `1px solid ${BRAND.border}`,
          }}
        >
          <Typography sx={{ fontSize: '12px', color: BRAND.muted, fontWeight: 600 }}>
            Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredModules.length)} of {filteredModules.length} categories
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
                    '&:hover': { backgroundColor: n === page ? BRAND.darkGreen : BRAND.tableHover },
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
                '&:disabled': { backgroundColor: BRAND.innerCard, color: BRAND.muted },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* ======================================================== */}
      {/* 4. VIEW CATEGORY DETAILS DRAWER */}
      {/* ======================================================== */}
      <Drawer
        anchor="right"
        open={viewDrawerOpen}
        onClose={handleCloseViewDrawer}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 380 },
            p: 3,
            boxSizing: 'border-box',
            backgroundColor: BRAND.white,
            color: BRAND.text,
            borderLeft: `1px solid ${BRAND.border}`,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
            Category Details
          </Typography>
          <IconButton onClick={handleCloseViewDrawer} size="small" sx={{ color: BRAND.muted }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {selectedModule && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                src={selectedModule.image}
                alt={selectedModule.name}
                variant="rounded"
                sx={{
                  width: 90,
                  height: 90,
                  mx: 'auto',
                  borderRadius: '12px',
                  border: `1px solid ${BRAND.border}`,
                }}
              />
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: BRAND.text, mt: 1.5 }}>
                {selectedModule.name}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 0.5 }}>
                <Chip
                  label={selectedModule.active ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{
                    bgcolor: selectedModule.active ? BRAND.lightGreen : BRAND.redLight,
                    color: selectedModule.active ? BRAND.green : BRAND.red,
                    fontWeight: 700,
                    height: 20,
                  }}
                />
              </Box>
            </Box>

            <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
              <Stack spacing={1.2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Associated Products:</Typography>
                  <Typography sx={{ fontSize: '13px', fontWeight: 800, color: BRAND.green }}>
                    {categoryProductsMap[selectedModule._id] || 0} items
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  const m = selectedModule;
                  handleCloseViewDrawer();
                  handleOpenFormDialog(m);
                }}
                sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: '8px', borderColor: BRAND.border, color: BRAND.text }}
              >
                Edit Category
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  const m = selectedModule;
                  handleCloseViewDrawer();
                  handleDeleteClick(m);
                }}
                sx={{ flex: 1, textTransform: 'none', fontWeight: 700, borderRadius: '8px', bgcolor: BRAND.red, '&:hover': { bgcolor: '#B91C1C' } }}
              >
                Delete
              </Button>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ======================================================== */}
      {/* 5. ADD / EDIT CATEGORY FORM MODAL */}
      {/* ======================================================== */}
      <Dialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            margin: { xs: 1.5, sm: 3 },
            backgroundColor: BRAND.white,
            color: BRAND.text,
            border: `1px solid ${BRAND.border}`,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', color: BRAND.text }}>
              {selectedModule ? 'Edit Category' : 'Add New Category'}
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted }}>
              {selectedModule ? 'Update category name and icon' : 'Create a marketplace product category'}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseFormDialog} size="small" sx={{ color: BRAND.muted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5, borderColor: BRAND.border }}>
          <Grid container spacing={2}>
            {/* Image upload */}
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              {imagePreview ? (
                <Avatar
                  src={imagePreview}
                  variant="rounded"
                  sx={{ width: 70, height: 70, mx: 'auto', mb: 1, borderRadius: '10px', border: `1px solid ${BRAND.border}` }}
                />
              ) : (
                <Box
                  sx={{
                    width: 70,
                    height: 70,
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
                  <CategoryIcon sx={{ color: BRAND.muted, fontSize: 26 }} />
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
                {imagePreview ? 'Replace Image' : 'Upload Icon/Image'}
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </Button>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Category Name *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                InputProps={{
                  sx: {
                    borderRadius: '8px',
                    fontSize: '13px',
                    backgroundColor: BRAND.innerCard,
                    color: BRAND.text,
                  },
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={handleInputChange}
                    name="active"
                    color="primary"
                  />
                }
                label={
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: BRAND.text }}>
                    Active & Visible in Marketplace
                  </Typography>
                }
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: `1px solid ${BRAND.border}`, justifyContent: 'space-between' }}>
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
            {submitting ? <CircularProgress size={20} color="inherit" /> : selectedModule ? 'Save Category' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* 6. DELETE CATEGORY CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '14px',
            p: 1,
            backgroundColor: BRAND.white,
            color: BRAND.text,
            border: `1px solid ${BRAND.border}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
          Delete Category?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: BRAND.muted }}>
            Are you sure you want to delete <strong style={{ color: BRAND.text }}>{selectedModule?.name}</strong>?
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
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Delete Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Modules;
