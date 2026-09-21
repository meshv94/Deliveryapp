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
  Switch,
  Avatar,
  Card,
  CardContent,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  Category as CategoryIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Inventory2 as ProductIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Clear as ClearIcon,
  Visibility as ViewIcon,
  Image as ImageIcon,
  ArrowForward as ArrowForwardIcon,
  Storefront as StoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import moduleService from '../services/moduleService';
import vendorService from '../services/vendorService';
import { brandColors } from '../theme/tokens';

const Modules = () => {
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

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog & Drawer States
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Action Menu State
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [activeMenuModule, setActiveMenuModule] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    active: true,
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  // Load modules and products on mount
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

      if (!map[modId]) {
        map[modId] = [];
      }
      map[modId].push(p);
    });

    return map;
  }, [products]);

  // Total calculations
  const totalCategories = modules.length;
  const activeCategoriesCount = modules.filter((m) => m.active).length;
  const inactiveCategoriesCount = modules.filter((m) => !m.active).length;
  const totalCategorizedProducts = products.length;

  // Filter and Search Categories
  const filteredModules = useMemo(() => {
    if (!Array.isArray(modules)) return [];

    return modules.filter((mod) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || (mod.name && mod.name.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = !!mod.active;
      } else if (statusFilter === 'INACTIVE') {
        matchesStatus = !mod.active;
      }

      return matchesSearch && matchesStatus;
    });
  }, [modules, searchQuery, statusFilter]);

  // Paginated records
  const paginatedModules = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredModules.slice(start, start + rowsPerPage);
  }, [filteredModules, page, rowsPerPage]);

  const totalPages = Math.ceil(filteredModules.length / rowsPerPage) || 1;

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter, rowsPerPage]);

  // Action Menu Handlers
  const handleOpenActionMenu = (event, mod) => {
    setActionMenuAnchor(event.currentTarget);
    setActiveMenuModule(mod);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setActiveMenuModule(null);
  };

  // Open Form Dialog (Create / Edit)
  const handleOpenFormDialog = (mod = null) => {
    if (mod) {
      setSelectedModule(mod);
      setFormData({
        name: mod.name || '',
        active: mod.active !== undefined ? mod.active : true,
        image: null,
      });
      setImagePreview(mod.image || null);
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
    handleCloseActionMenu();
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setSelectedModule(null);
    setFormData({
      name: '',
      active: true,
      image: null,
    });
    setImagePreview(null);
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

  // Submit Create or Update
  const handleSubmitForm = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('active', formData.active);

      if (formData.image) {
        data.append('image', formData.image);
      }

      if (selectedModule) {
        await moduleService.updateModule(selectedModule._id, data);
        setSuccess(`Category "${formData.name.trim()}" updated successfully!`);
      } else {
        await moduleService.createModule(data);
        setSuccess(`Category "${formData.name.trim()}" created successfully!`);
      }

      handleCloseFormDialog();
      await loadAllData(true);
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (mod) => {
    try {
      const data = {
        name: mod.name,
        active: !mod.active,
      };
      await moduleService.updateModule(mod._id, data);
      setSuccess(`Category "${mod.name}" ${!mod.active ? 'activated' : 'deactivated'} successfully!`);
      await loadAllData(true);
    } catch (err) {
      console.error('Error updating category status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update category status.');
    }
  };

  // Delete Category
  const handleOpenDeleteDialog = (mod) => {
    setSelectedModule(mod);
    setDeleteDialogOpen(true);
    handleCloseActionMenu();
  };

  const handleConfirmDelete = async () => {
    if (!selectedModule) return;
    try {
      setSubmitting(true);
      setError(null);

      await moduleService.deleteModule(selectedModule._id);
      setSuccess(`Category "${selectedModule.name}" deleted successfully!`);
      setDeleteDialogOpen(false);
      if (viewDrawerOpen && selectedModule._id === selectedModule?._id) {
        setViewDrawerOpen(false);
      }
      setSelectedModule(null);
      await loadAllData(true);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete category.');
    } finally {
      setSubmitting(false);
    }
  };

  // View Category Overview Drawer
  const handleViewCategory = (mod) => {
    setSelectedModule(mod);
    setViewDrawerOpen(true);
    handleCloseActionMenu();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPage(0);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'ALL';

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
          Loading marketplace categories...
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
              Categories
            </Typography>
            <Chip
              icon={<CategoryIcon sx={{ fontSize: '16px !important', color: `${brandColors.primaryGreen} !important` }} />}
              label="Marketplace Verticals"
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
            Manage marketplace business verticals and product categories.
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
            onClick={() => loadAllData(true)}
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

          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
            onClick={() => handleOpenFormDialog()}
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
            Create Category
          </Button>
        </Stack>
      </Box>

      {/* KPI Bento Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Categories */}
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
                    Total Categories
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.primaryText, fontSize: '1.85rem' }}>
                    {totalCategories}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.primaryGreen, fontWeight: 700, mt: 0.5 }}>
                    Business Verticals
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
                  <CategoryIcon sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Categories */}
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
                    Active Verticals
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#16A34A', fontSize: '1.85rem' }}>
                    {activeCategoriesCount}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700, mt: 0.5 }}>
                    Visible in marketplace
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

        {/* Inactive Categories */}
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
                    Inactive Categories
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.secondaryText, fontSize: '1.85rem' }}>
                    {inactiveCategoriesCount}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText, fontWeight: 700, mt: 0.5 }}>
                    Hidden from storefront
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
                  <Typography variant="h4" sx={{ fontWeight: 800, color: brandColors.blueAccent, fontSize: '1.85rem' }}>
                    {totalCategorizedProducts}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.blueAccent, fontWeight: 700, mt: 0.5 }}>
                    Catalog Inventory
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    bgcolor: brandColors.lightBlue,
                    color: brandColors.blueAccent,
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    border: `1px solid ${brandColors.borderBlue}`,
                  }}
                >
                  <ProductIcon sx={{ fontSize: 28 }} />
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
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by category name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: brandColors.secondaryText, fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
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

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={3.5}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.88rem', color: brandColors.secondaryText }}>Display Status</InputLabel>
              <Select
                value={statusFilter}
                label="Display Status"
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
                <MenuItem value="ALL">All Categories</MenuItem>
                <MenuItem value="ACTIVE">Active Only</MenuItem>
                <MenuItem value="INACTIVE">Inactive Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Clear Button */}
          <Grid item xs={12} sm={6} md={2.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              {hasActiveFilters && (
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={handleClearFilters}
                  startIcon={<ClearIcon />}
                  sx={{
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: brandColors.orange,
                    borderColor: brandColors.borderOrange,
                    backgroundColor: brandColors.lightOrange,
                    py: 0.9,
                    '&:hover': {
                      backgroundColor: brandColors.borderOrange,
                      borderColor: brandColors.orange,
                    },
                  }}
                >
                  Reset Filters
                </Button>
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
            Showing <strong>{filteredModules.length}</strong> of <strong>{modules.length}</strong> categories
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

      {/* Main Categories Table Paper */}
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
          <Table sx={{ minWidth: 780 }}>
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
                <TableCell>Icon / Image</TableCell>
                <TableCell>Category Name</TableCell>
                <TableCell align="center">Products</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell>Active Toggle</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedModules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: brandColors.adminBg,
                          color: brandColors.secondaryText,
                        }}
                      >
                        <CategoryIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography sx={{ fontWeight: 700, color: brandColors.primaryText, fontSize: '1rem' }}>
                        No categories found
                      </Typography>
                      <Typography sx={{ color: brandColors.secondaryText, fontSize: '0.85rem' }}>
                        Create your first category or adjust your search filter.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedModules.map((mod) => {
                  const productCount = categoryProductsMap[mod._id]?.length || 0;

                  return (
                    <TableRow
                      key={mod._id}
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
                      {/* Icon / Image */}
                      <TableCell>
                        <Avatar
                          src={mod.image || ''}
                          alt={mod.name}
                          variant="rounded"
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '14px',
                            background: mod.image
                              ? '#FFFFFF'
                              : `linear-gradient(135deg, ${brandColors.primaryGreen} 0%, ${brandColors.darkGreen} 100%)`,
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            border: `1px solid ${brandColors.border}`,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          }}
                        >
                          {!mod.image && (mod.name ? mod.name[0].toUpperCase() : 'C')}
                        </Avatar>
                      </TableCell>

                      {/* Category Name */}
                      <TableCell>
                        <Box>
                          <Typography
                            onClick={() => handleViewCategory(mod)}
                            sx={{
                              fontWeight: 700,
                              color: brandColors.primaryText,
                              fontSize: '0.95rem',
                              cursor: 'pointer',
                              '&:hover': {
                                color: brandColors.primaryGreen,
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            {mod.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText, mt: 0.2 }}>
                            ID: {mod._id ? `${mod._id.slice(0, 8)}...` : '-'}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Products Count */}
                      <TableCell align="center">
                        <Chip
                          icon={<ProductIcon sx={{ fontSize: '14px !important', color: productCount > 0 ? `${brandColors.blueAccent} !important` : `${brandColors.secondaryText} !important` }} />}
                          label={`${productCount} ${productCount === 1 ? 'product' : 'products'}`}
                          size="small"
                          onClick={() => handleViewCategory(mod)}
                          clickable
                          sx={{
                            fontWeight: 700,
                            fontSize: '12px',
                            backgroundColor: productCount > 0 ? brandColors.lightBlue : '#F1F5F9',
                            color: productCount > 0 ? brandColors.blueAccent : brandColors.secondaryText,
                            borderRadius: '8px',
                            border: productCount > 0 ? `1px solid ${brandColors.borderBlue}` : 'none',
                          }}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.4,
                            py: 0.45,
                            borderRadius: '50px',
                            backgroundColor: mod.active ? '#DCFCE7' : '#F1F5F9',
                            color: mod.active ? '#15803D' : '#64748B',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: mod.active ? '#22C55E' : '#94A3B8',
                            }}
                          />
                          {mod.active ? 'Active' : 'Inactive'}
                        </Box>
                      </TableCell>

                      {/* Created Date */}
                      <TableCell>
                        <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, fontWeight: 600 }}>
                          {mod.createdAt
                            ? new Date(mod.createdAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </Typography>
                      </TableCell>

                      {/* Active Toggle */}
                      <TableCell>
                        <Switch
                          checked={Boolean(mod.active)}
                          onChange={() => handleToggleActive(mod)}
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
                          {/* Quick View Button */}
                          <Tooltip title="View Category Overview">
                            <IconButton
                              size="small"
                              onClick={() => handleViewCategory(mod)}
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

                          {/* Quick Edit Button */}
                          <Tooltip title="Edit Category">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenFormDialog(mod)}
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

                          {/* More Options Dropdown */}
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenActionMenu(e, mod)}
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
            Showing <strong>{filteredModules.length === 0 ? 0 : page * rowsPerPage + 1}</strong> to{' '}
            <strong>{Math.min((page + 1) * rowsPerPage, filteredModules.length)}</strong> of{' '}
            <strong>{filteredModules.length}</strong> categories
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
        <MenuItem onClick={() => handleViewCategory(activeMenuModule)}>
          <ListItemIcon sx={{ color: brandColors.blueAccent }}>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Category Overview" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
        </MenuItem>

        <MenuItem onClick={() => handleOpenFormDialog(activeMenuModule)}>
          <ListItemIcon sx={{ color: brandColors.primaryGreen }}>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit Category" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
        </MenuItem>

        <MenuItem onClick={() => { const m = activeMenuModule; handleCloseActionMenu(); if (m) handleToggleActive(m); }}>
          <ListItemIcon sx={{ color: activeMenuModule?.active ? '#D97706' : '#16A34A' }}>
            {activeMenuModule?.active ? <CancelIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText
            primary={activeMenuModule?.active ? 'Deactivate Category' : 'Activate Category'}
            primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }}
          />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={() => handleOpenDeleteDialog(activeMenuModule)} sx={{ color: '#EF4444' }}>
          <ListItemIcon sx={{ color: '#EF4444' }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Delete Category" primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: 600 }} />
        </MenuItem>
      </Menu>

      {/* ======================================================== */}
      {/* CATEGORY DETAILS DRAWER */}
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
        {selectedModule && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Drawer Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: brandColors.primaryText }}>
                Category Overview
              </Typography>
              <IconButton
                onClick={() => setViewDrawerOpen(false)}
                sx={{
                  color: brandColors.secondaryText,
                  borderRadius: '10px',
                  '&:hover': { backgroundColor: '#F1F5F9' },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Scrollable Content */}
            <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
              {/* Category Profile Card */}
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
                  src={selectedModule.image || ''}
                  alt={selectedModule.name}
                  variant="rounded"
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: '18px',
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    background: selectedModule.image
                      ? '#FFFFFF'
                      : `linear-gradient(135deg, ${brandColors.primaryGreen} 0%, ${brandColors.darkGreen} 100%)`,
                    color: '#FFFFFF',
                    border: `1px solid ${brandColors.border}`,
                  }}
                >
                  {!selectedModule.image && selectedModule.name?.charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: brandColors.primaryText }}>
                    {selectedModule.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, mt: 0.4 }}>
                    ID: {selectedModule._id}
                  </Typography>

                  <Box sx={{ mt: 1.5 }}>
                    <Chip
                      label={selectedModule.active ? 'Active on Marketplace' : 'Inactive / Hidden'}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: selectedModule.active ? '#DCFCE7' : '#F1F5F9',
                        color: selectedModule.active ? '#15803D' : '#64748B',
                        borderRadius: '50px',
                      }}
                    />
                  </Box>
                </Box>
              </Paper>

              {/* Metric Highlights */}
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
                      Linked Products
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: brandColors.blueAccent, mt: 0.5 }}>
                      {categoryProductsMap[selectedModule._id]?.length || 0}
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
                      Status
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: selectedModule.active ? '#16A34A' : '#64748B', mt: 0.5 }}>
                      {selectedModule.active ? 'Active' : 'Inactive'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Linked Products List */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: brandColors.primaryText }}>
                  Associated Products ({categoryProductsMap[selectedModule._id]?.length || 0})
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    setViewDrawerOpen(false);
                    navigate('/products');
                  }}
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: brandColors.primaryGreen,
                  }}
                >
                  View in Products
                </Button>
              </Box>

              {categoryProductsMap[selectedModule._id]?.length > 0 ? (
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  {categoryProductsMap[selectedModule._id].slice(0, 6).map((prod) => (
                    <Paper
                      key={prod._id}
                      elevation={0}
                      sx={{
                        p: 1.8,
                        borderRadius: '14px',
                        border: `1px solid ${brandColors.border}`,
                        backgroundColor: '#F8FAFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={prod.image || ''}
                          alt={prod.name}
                          variant="rounded"
                          sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#FFFFFF', border: `1px solid ${brandColors.border}` }}
                        >
                          <ProductIcon sx={{ fontSize: 20, color: brandColors.secondaryText }} />
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: brandColors.primaryText }}>
                            {prod.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText }}>
                            Vendor: {prod.vendor_id?.name || prod.vendor?.name || 'Local Store'}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: brandColors.primaryGreen }}>
                        ₹{Number(prod.special_price || prod.main_price || 0).toLocaleString('en-IN')}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mb: 3,
                    textAlign: 'center',
                    borderRadius: '14px',
                    border: `1px dashed ${brandColors.border}`,
                    backgroundColor: '#F8FAFC',
                  }}
                >
                  <Typography sx={{ fontSize: '0.85rem', color: brandColors.secondaryText, fontWeight: 500 }}>
                    No products currently assigned to this category.
                  </Typography>
                </Paper>
              )}
            </Box>

            {/* Drawer Bottom Actions */}
            <Box sx={{ pt: 2, borderTop: `1px solid ${brandColors.divider}` }}>
              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setViewDrawerOpen(false);
                      handleOpenFormDialog(selectedModule);
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
                    Edit Category
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => {
                      setViewDrawerOpen(false);
                      handleToggleActive(selectedModule);
                    }}
                    sx={{
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 700,
                      backgroundColor: selectedModule.active ? '#D97706' : '#16A34A',
                      color: '#FFFFFF',
                      py: 1,
                      '&:hover': {
                        backgroundColor: selectedModule.active ? '#B45309' : '#15803D',
                      },
                    }}
                  >
                    {selectedModule.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* ======================================================== */}
      {/* CREATE / EDIT CATEGORY DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={formDialogOpen}
        onClose={handleCloseFormDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: brandColors.primaryText }}>
              {selectedModule ? 'Edit Category' : 'Create New Category'}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: brandColors.secondaryText, mt: 0.2 }}>
              Configure category name, icon badge, and storefront visibility
            </Typography>
          </Box>
          <IconButton onClick={handleCloseFormDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: brandColors.divider, py: 3 }}>
          <Grid container spacing={2.5}>
            {/* Category Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. Grocery, Fruits & Vegetables, Bakery"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  },
                }}
              />
            </Grid>

            {/* Category Icon / Image Upload */}
            <Grid item xs={12}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: brandColors.primaryText, mb: 1 }}>
                Category Icon / Image
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={imagePreview || ''}
                  variant="rounded"
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: '16px',
                    border: `1.5px dashed ${brandColors.border}`,
                    backgroundColor: '#F8FAFC',
                  }}
                >
                  <ImageIcon sx={{ fontSize: 32, color: brandColors.secondaryText }} />
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderColor: brandColors.border,
                      color: brandColors.primaryText,
                      mb: 0.5,
                      '&:hover': {
                        borderColor: brandColors.primaryGreen,
                      },
                    }}
                  >
                    {imagePreview ? 'Change Image' : 'Upload Icon / Image'}
                    <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                  </Button>
                  <Typography sx={{ fontSize: '0.75rem', color: brandColors.secondaryText }}>
                    Recommended format: PNG/JPEG, square aspect ratio
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Active Toggle */}
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: '14px',
                  backgroundColor: '#F8FAFC',
                  border: `1px solid ${brandColors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: brandColors.primaryText }}>
                    Display on Marketplace
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: brandColors.secondaryText }}>
                    When enabled, this vertical is available for store vendors and customer browsing.
                  </Typography>
                </Box>
                <Switch
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: brandColors.primaryGreen,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: brandColors.primaryGreen,
                    },
                  }}
                />
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={handleCloseFormDialog}
            disabled={submitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              color: brandColors.secondaryText,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitForm}
            disabled={submitting || !formData.name.trim()}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: brandColors.primaryGreen,
              color: '#FFFFFF',
              px: 3,
              '&:hover': {
                backgroundColor: brandColors.darkGreen,
              },
            }}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : selectedModule ? (
              'Update Category'
            ) : (
              'Create Category'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#DC2626' }}>
          Delete Category?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem', color: brandColors.secondaryText, lineHeight: 1.5 }}>
            Are you sure you want to permanently delete category{' '}
            <strong>{selectedModule?.name}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2, borderRadius: '10px', fontSize: '0.82rem' }}>
            Products linked to this category may need to be reassigned.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={submitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              color: brandColors.secondaryText,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={submitting}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              px: 2.5,
              '&:hover': {
                backgroundColor: '#DC2626',
              },
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
