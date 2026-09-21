import React, { useState, useEffect, useRef } from 'react';
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
  Checkbox,
  Menu,
  InputBase,
  Tooltip,
  ListItemIcon,
  Skeleton,
  Divider,
  Stack,
} from '@mui/material';
import {
  AddRounded as AddIcon,
  EditRounded as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  CloseRounded as CloseIcon,
  CloudUploadRounded as UploadIcon,
  MyLocationRounded as MyLocationIcon,
  SearchRounded as SearchIcon,
  Inventory2Outlined as InventoryIcon,
  FilterListRounded as FilterListIcon,
  ChevronLeftRounded as ChevronLeftIcon,
  ChevronRightRounded as ChevronRightIcon,
  StorefrontRounded as StorefrontIcon,
  EmailOutlined as EmailIcon,
  PhoneOutlined as PhoneIcon,
  LocationOnOutlined as LocationIcon,
  VisibilityOutlined as ViewIcon,
  AccessTimeRounded as TimeIcon,
  PaymentsOutlined as MoneyIcon,
  LocalShippingOutlined as DeliveryIcon,
  CategoryOutlined as CategoryIcon,
  ShoppingBagOutlined as OrdersIcon,
  CheckCircleRounded as CheckCircleIcon,
  CancelRounded as BlockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import vendorService from '../services/vendorService';
import moduleService from '../services/moduleService';
import orderService from '../services/orderService';
import { useColorMode } from '../theme/ThemeContext';

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
};

const Vendors = () => {
  const { BRAND, isDark } = useColorMode();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [modules, setModules] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Table state
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [viewVendorDialog, setViewVendorDialog] = useState(false);
  const [viewingVendor, setViewingVendor] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Product Management states
  const [productsDialog, setProductsDialog] = useState(false);
  const [productFormDialog, setProductFormDialog] = useState(false);
  const [productDeleteDialog, setProductDeleteDialog] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: '',
    main_price: '',
    special_price: '',
    preparation_time_minute: 0,
    packaging_charge: 0,
    vendor_id: '',
    module_id: '',
    isActive: true,
    image: null,
  });
  const [productImagePreview, setProductImagePreview] = useState(null);

  // Admin Role & Permissions
  const adminData = (() => {
    try {
      return JSON.parse(localStorage.getItem('adminData') || '{}');
    } catch {
      return {};
    }
  })();
  const isSuperAdmin = adminData.role === 'super_admin';
  const canUpdateVendor = isSuperAdmin || Boolean(adminData.permissions?.canUpdateVendor);
  const canManageProducts = isSuperAdmin || Boolean(adminData.permissions?.canManageProducts);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    mobile_number: '',
    address: '',
    latitude: '',
    longitude: '',
    open_time: '',
    close_time: '',
    timezone: 'Asia/Kolkata',
    preparation_time_minute: 0,
    packaging_charge: 0,
    delivery_charge: 0,
    convenience_charge: 0,
    status: 1,
    module: '',
    vendor_image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);

  // Google Maps state
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Google Maps refs
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCpAhl9zWxIfigpQ17hkcgjHoKPNDP07pI';

  // Fetch vendors and modules on mount
  useEffect(() => {
    fetchVendors();
    fetchModules();
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!openDialog) return;

    if (window.google && window.google.maps && window.google.maps.places) {
      setMapLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }
      existingScript.remove();
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    document.head.appendChild(script);
  }, [openDialog, GOOGLE_MAPS_API_KEY]);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !openDialog || !mapRef.current) return;

    const defaultCenter = currentLocation || { lat: 21.1702, lng: 72.8311 }; // Default to Surat, Gujarat

    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const marker = new window.google.maps.Marker({
      position: defaultCenter,
      map: map,
      draggable: true,
      title: 'Vendor Location',
    });

    markerRef.current = marker;

    // Initialize autocomplete
    if (addressInputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'in' },
        }
      );

      autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
    }

    // Update location when marker is dragged
    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      const lat = position.lat();
      const lng = position.lng();
      setCurrentLocation({ lat, lng });
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
      reverseGeocode(lat, lng);
    });

    // Update location when map is clicked
    map.addListener('click', (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      marker.setPosition({ lat, lng });
      setCurrentLocation({ lat, lng });
      setFormData((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
      reverseGeocode(lat, lng);
    });
  }, [mapLoaded, openDialog]);

  // Reverse Geocode to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat, lng };

      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const addressComponents = results[0].address_components;
          let city = '';
          let pincode = '';

          addressComponents.forEach((component) => {
            if (component.types.includes('locality')) {
              city = component.long_name;
            }
            if (component.types.includes('postal_code')) {
              pincode = component.long_name;
            }
          });

          setFormData((prev) => ({
            ...prev,
            address: prev.address || results[0].formatted_address,
            city: prev.city || city,
            pincode: prev.pincode || pincode,
          }));
        }
      });
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const [vendorsRes, modulesRes, productsRes, ordersRes] = await Promise.allSettled([
        vendorService.getAllVendors(),
        moduleService.getActiveModules(),
        vendorService.getAllProducts(),
        orderService.getAllOrders(),
      ]);

      if (vendorsRes.status === 'fulfilled') {
        setVendors(vendorsRes.value?.data || []);
      } else {
        throw new Error(vendorsRes.reason?.message || 'Failed to fetch vendors');
      }

      if (modulesRes.status === 'fulfilled') {
        setModules(modulesRes.value?.data || []);
      }

      if (productsRes.status === 'fulfilled') {
        setAllProducts(productsRes.value?.data || []);
      }

      if (ordersRes.status === 'fulfilled') {
        setAllOrders(ordersRes.value?.data || []);
      }

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await moduleService.getActiveModules();
      if (response.success) {
        setModules(response.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch active modules:', err);
    }
  };

  const handleOpenDialog = (vendor = null) => {
    if (vendor) {
      // Edit mode
      setSelectedVendor(vendor);
      setFormData({
        name: vendor.name || '',
        email: vendor.email || '',
        description: vendor.description || '',
        mobile_number: vendor.mobile_number || '',
        address: vendor.address || '',
        latitude: vendor.latitude || '',
        longitude: vendor.longitude || '',
        open_time: vendor.open_time || '',
        close_time: vendor.close_time || '',
        timezone: vendor.timezone || 'Asia/Kolkata',
        preparation_time_minute: vendor.preparation_time_minute || 0,
        packaging_charge: vendor.packaging_charge || 0,
        delivery_charge: vendor.delivery_charge || 0,
        convenience_charge: vendor.convenience_charge || 0,
        status: vendor.status !== undefined ? vendor.status : 1,
        module: vendor.module?._id || vendor.module || '',
        vendor_image: null,
      });
      setImagePreview(vendor.vendor_image || null);

      if (vendor.latitude && vendor.longitude) {
        setCurrentLocation({
          lat: parseFloat(vendor.latitude),
          lng: parseFloat(vendor.longitude),
        });
      } else {
        setCurrentLocation(null);
      }
    } else {
      // Add mode
      setSelectedVendor(null);
      setFormData({
        name: '',
        email: '',
        description: '',
        mobile_number: '',
        address: '',
        latitude: '',
        longitude: '',
        open_time: '',
        close_time: '',
        timezone: 'Asia/Kolkata',
        preparation_time_minute: 0,
        packaging_charge: 0,
        delivery_charge: 0,
        convenience_charge: 0,
        status: 1,
        module: modules[0]?._id || '',
        vendor_image: null,
      });
      setImagePreview(null);
      setCurrentLocation(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVendor(null);
    setImagePreview(null);
  };

  const handleOpenViewDetails = (vendor) => {
    setViewingVendor(vendor);
    setViewVendorDialog(true);
  };

  const handleCloseViewDetails = () => {
    setViewVendorDialog(false);
    setViewingVendor(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        vendor_image: file,
      }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePlaceSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();

      if (!place.geometry) {
        console.error('No geometry found for selected place');
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const latitude = lat.toString();
      const longitude = lng.toString();
      const address = place.formatted_address || '';

      let city = '';
      let pincode = '';

      if (place.address_components) {
        place.address_components.forEach((component) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('postal_code')) {
            pincode = component.long_name;
          }
        });
      }

      setCurrentLocation({ lat, lng });
      setFormData((prev) => ({
        ...prev,
        address,
        latitude,
        longitude,
        city: city || prev.city,
        pincode: pincode || prev.pincode,
      }));

      if (markerRef.current) {
        markerRef.current.setPosition({ lat, lng });
        markerRef.current.getMap().setCenter({ lat, lng });
      }
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation({ lat, lng });
          setFormData((prev) => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString(),
          }));

          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
            markerRef.current.getMap().setCenter({ lat, lng });
          }

          reverseGeocode(lat, lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please allow location access in browser.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Search for location on map
  const handleMapSearch = async () => {
    if (!searchQuery.trim() || !window.google) return;

    setSearching(true);
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ address: searchQuery }, (results, status) => {
      setSearching(false);
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();

        setCurrentLocation({ lat, lng });
        setFormData((prev) => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
        }));

        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
          markerRef.current.getMap().setCenter({ lat, lng });
        }

        reverseGeocode(lat, lng);
        setSearchQuery('');
      } else {
        alert('Location not found. Please try a different search.');
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('description', formData.description || '');
      data.append('mobile_number', formData.mobile_number);
      data.append('address', formData.address || '');
      data.append('latitude', formData.latitude || '');
      data.append('longitude', formData.longitude || '');
      data.append('open_time', formData.open_time || '');
      data.append('close_time', formData.close_time || '');
      data.append('timezone', formData.timezone || 'Asia/Kolkata');
      data.append('preparation_time_minute', formData.preparation_time_minute || 0);
      data.append('packaging_charge', formData.packaging_charge || 0);
      data.append('delivery_charge', formData.delivery_charge || 0);
      data.append('convenience_charge', formData.convenience_charge || 0);
      data.append('status', formData.status !== undefined ? formData.status : 1);
      data.append('module', formData.module || '');

      if (formData.vendor_image) {
        data.append('vendor_image', formData.vendor_image);
      }

      if (selectedVendor) {
        await vendorService.updateVendor(selectedVendor._id, data);
        setSuccess('Vendor updated successfully!');
      } else {
        await vendorService.createVendor(data);
        setSuccess('Vendor created successfully!');
      }

      handleCloseDialog();
      fetchVendors();
    } catch (err) {
      setError(err.message || 'Failed to save vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (vendor) => {
    setSelectedVendor(vendor);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await vendorService.deleteVendor(selectedVendor._id);
      setSuccess('Vendor deleted successfully!');
      setDeleteDialog(false);
      setSelectedVendor(null);
      fetchVendors();
    } catch (err) {
      setError(err.message || 'Failed to delete vendor');
    } finally {
      setSubmitting(false);
    }
  };

  // Product Management Functions
  const handleOpenProductsDialog = async (vendor) => {
    setCurrentVendor(vendor);
    setProductsDialog(true);
    await fetchVendorProducts(vendor._id);
  };

  const fetchVendorProducts = async (vendorId) => {
    try {
      setLoadingProducts(true);
      const response = await vendorService.getProductsByVendor(vendorId);
      setProducts(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenProductForm = (product = null) => {
    if (product) {
      setSelectedProduct(product);
      setProductFormData({
        name: product.name || '',
        main_price: product.main_price || '',
        special_price: product.special_price || '',
        preparation_time_minute: product.preparation_time_minute || 0,
        packaging_charge: product.packaging_charge || 0,
        vendor_id: product.vendor_id?._id || currentVendor?._id || '',
        module_id: product.module_id?._id || currentVendor?.module?._id || '',
        isActive: product.isActive !== undefined ? product.isActive : true,
        image: null,
      });
      setProductImagePreview(product.image || null);
    } else {
      setSelectedProduct(null);
      setProductFormData({
        name: '',
        main_price: '',
        special_price: '',
        preparation_time_minute: 0,
        packaging_charge: 0,
        vendor_id: currentVendor?._id || '',
        module_id: currentVendor?.module?._id || currentVendor?.module || '',
        isActive: true,
        image: null,
      });
      setProductImagePreview(null);
    }
    setProductFormDialog(true);
  };

  const handleCloseProductForm = () => {
    setProductFormDialog(false);
    setSelectedProduct(null);
    setProductImagePreview(null);
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductFormData((prev) => ({
        ...prev,
        image: file,
      }));
      setProductImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProductSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const data = new FormData();
      data.append('name', productFormData.name);
      data.append('main_price', productFormData.main_price);
      data.append('special_price', productFormData.special_price || '');
      data.append('preparation_time_minute', productFormData.preparation_time_minute);
      data.append('packaging_charge', productFormData.packaging_charge);
      data.append('vendor_id', productFormData.vendor_id);
      data.append('module_id', productFormData.module_id);
      data.append('isActive', productFormData.isActive);

      if (productFormData.image) {
        data.append('image', productFormData.image);
      }

      if (selectedProduct) {
        await vendorService.updateProduct(selectedProduct._id, data);
        setSuccess('Product updated successfully!');
      } else {
        await vendorService.createProduct(data);
        setSuccess('Product created successfully!');
      }

      handleCloseProductForm();
      await fetchVendorProducts(currentVendor._id);
      fetchVendors(); // Refresh product count in main list
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProductDeleteClick = (product) => {
    setSelectedProduct(product);
    setProductDeleteDialog(true);
  };

  const handleProductDeleteConfirm = async () => {
    try {
      setSubmitting(true);
      await vendorService.deleteProduct(selectedProduct._id);
      setSuccess('Product deleted successfully!');
      setProductDeleteDialog(false);
      setSelectedProduct(null);
      await fetchVendorProducts(currentVendor._id);
      fetchVendors();
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter logic
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      !tableSearch ||
      v.name?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      v.email?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      v.mobile_number?.includes(tableSearch) ||
      v.city?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      v.address?.toLowerCase().includes(tableSearch.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !v.isBlocked && v.status !== 0) ||
      (statusFilter === 'blocked' && (v.isBlocked || v.status === 0));
    const matchesModule =
      moduleFilter === 'all' ||
      v.module?._id === moduleFilter ||
      v.module === moduleFilter;
    return matchesSearch && matchesStatus && matchesModule;
  });

  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / rowsPerPage));
  const paginatedVendors = filteredVendors.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const activeCount = vendors.filter((v) => !v.isBlocked && v.status !== 0).length;
  const blockedCount = vendors.filter((v) => v.isBlocked || v.status === 0).length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedVendors.map((v) => v._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
            Vendors Management
          </Typography>
          <Typography
            sx={{
              color: BRAND.muted,
              fontSize: { xs: '0.8rem', sm: '0.85rem' },
              fontWeight: 500,
              mt: 0.2,
            }}
          >
            Manage AapnuBazaar marketplace vendors, stores and catalogs
          </Typography>
        </Box>
        {isSuperAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon sx={{ fontSize: '18px !important' }} />}
            onClick={() => handleOpenDialog()}
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
            + Add Vendor
          </Button>
        )}
      </Box>

      {/* ======================================================== */}
      {/* 2. SUMMARY FILTER TABS */}
      {/* ======================================================== */}
      <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mb: 2.5 }}>
        {[
          { label: 'All Vendors', value: vendors.length, filter: 'all', bg: BRAND.lightGreen, color: BRAND.green, active: statusFilter === 'all' },
          { label: 'Active', value: activeCount, filter: 'active', bg: '#DCFCE7', color: '#16A34A', active: statusFilter === 'active' },
          { label: 'Blocked', value: blockedCount, filter: 'blocked', bg: BRAND.redLight, color: BRAND.red, active: statusFilter === 'blocked' },
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
              Vendors Directory
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted, mt: 0.2 }}>
              {filteredVendors.length} {filteredVendors.length === 1 ? 'store' : 'stores'} found
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
                placeholder="Search vendors..."
                value={tableSearch}
                onChange={(e) => {
                  setTableSearch(e.target.value);
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

            {/* Category Dropdown */}
            {modules.length > 0 && (
              <Box
                component="select"
                value={moduleFilter}
                onChange={(e) => {
                  setModuleFilter(e.target.value);
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

            {/* Status Dropdown Filter Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<FilterListIcon sx={{ fontSize: '16px !important' }} />}
              onClick={(e) => setFilterAnchor(e.currentTarget)}
              sx={{
                borderColor: BRAND.border,
                color: BRAND.muted,
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                px: 1.6,
                py: 0.6,
                textTransform: 'none',
                '&:hover': { borderColor: BRAND.green, backgroundColor: BRAND.innerCard },
              }}
            >
              {statusFilter === 'all'
                ? 'Status'
                : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </Button>
            <Menu
              anchorEl={filterAnchor}
              open={Boolean(filterAnchor)}
              onClose={() => setFilterAnchor(null)}
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  minWidth: 150,
                  p: 0.5,
                  bgcolor: BRAND.white,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  border: `1px solid ${BRAND.border}`,
                },
              }}
            >
              {['all', 'active', 'blocked'].map((f) => (
                <MenuItem
                  key={f}
                  selected={statusFilter === f}
                  onClick={() => {
                    setStatusFilter(f);
                    setFilterAnchor(null);
                    setPage(1);
                  }}
                  sx={{ borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, py: 0.8 }}
                >
                  {f === 'all' ? 'All Statuses' : f.charAt(0).toUpperCase() + f.slice(1)}
                </MenuItem>
              ))}
            </Menu>
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
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={
                        paginatedVendors.length > 0 &&
                        paginatedVendors.every((v) => selectedIds.includes(v._id))
                      }
                      indeterminate={
                        paginatedVendors.some((v) => selectedIds.includes(v._id)) &&
                        !paginatedVendors.every((v) => selectedIds.includes(v._id))
                      }
                      onChange={handleSelectAll}
                      sx={{ color: BRAND.border, '&.Mui-checked': { color: BRAND.green } }}
                    />
                  </TableCell>
                  <TableCell>Store</TableCell>
                  <TableCell>Vendor / Owner</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="center">Products</TableCell>
                  <TableCell align="center">Orders</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={9} sx={{ py: 1.6 }}>
                        <Skeleton variant="text" width="100%" height={32} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedVendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <StorefrontIcon sx={{ fontSize: 44, color: BRAND.muted, mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography sx={{ color: BRAND.text, fontWeight: 700, fontSize: '14px' }}>
                        No vendors found
                      </Typography>
                      <Typography sx={{ color: BRAND.muted, fontSize: '12px', mt: 0.3, mb: 1.5 }}>
                        {tableSearch || statusFilter !== 'all' || moduleFilter !== 'all'
                          ? 'No vendors match your current search or filters.'
                          : 'Add your first vendor to get started.'}
                      </Typography>
                      {(tableSearch || statusFilter !== 'all' || moduleFilter !== 'all') && (
                        <Button
                          size="small"
                          onClick={() => {
                            setTableSearch('');
                            setStatusFilter('all');
                            setModuleFilter('all');
                          }}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '12px',
                            color: BRAND.green,
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedVendors.map((vendor) => {
                    const isSelected = selectedIds.includes(vendor._id);
                    const isActive = !vendor.isBlocked && vendor.status !== 0;
                    const vendorProductsCount = allProducts.filter(
                      (p) => (p.vendor_id?._id || p.vendor_id || p.vendor?._id || p.vendor) === vendor._id
                    ).length;
                    const vendorOrdersCount = allOrders.filter(
                      (o) => (o.vendor?._id || o.vendor) === vendor._id
                    ).length;

                    return (
                      <TableRow
                        key={vendor._id}
                        hover
                        selected={isSelected}
                        sx={{
                          '& td': { borderBottom: `1px solid ${BRAND.divider}`, py: 1.3 },
                          '&.Mui-selected': { backgroundColor: 'rgba(16,185,129,0.08)' },
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: BRAND.innerCard },
                          transition: 'background-color 0.12s ease',
                        }}
                      >
                        {/* Checkbox */}
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleSelectRow(vendor._id)}
                            sx={{ color: BRAND.border, '&.Mui-checked': { color: BRAND.green } }}
                          />
                        </TableCell>

                        {/* Store info */}
                        <TableCell onClick={() => handleOpenViewDetails(vendor)}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={vendor.vendor_image}
                              alt={vendor.name}
                              variant="rounded"
                              sx={{
                                width: 38,
                                height: 38,
                                borderRadius: '10px',
                                backgroundColor: BRAND.innerCard,
                                border: `1px solid ${BRAND.border}`,
                              }}
                            >
                              <StorefrontIcon sx={{ color: BRAND.muted, fontSize: 20 }} />
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: BRAND.text, lineHeight: 1.2 }}>
                                {vendor.name}
                              </Typography>
                              <Typography sx={{ fontSize: '11px', color: BRAND.muted, mt: 0.2 }}>
                                {vendor.open_time && vendor.close_time
                                  ? `${vendor.open_time} – ${vendor.close_time}`
                                  : `Delivery fee: ₹${vendor.delivery_charge || 0}`}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Vendor / Owner */}
                        <TableCell onClick={() => handleOpenViewDetails(vendor)}>
                          <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: BRAND.text }}>
                            {vendor.email || '—'}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: BRAND.muted, mt: 0.1 }}>
                            {vendor.mobile_number || '—'}
                          </Typography>
                        </TableCell>

                        {/* Category */}
                        <TableCell onClick={() => handleOpenViewDetails(vendor)}>
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
                            {vendor.module?.name || 'Store'}
                          </Box>
                        </TableCell>

                        {/* Location */}
                        <TableCell onClick={() => handleOpenViewDetails(vendor)}>
                          <Typography sx={{ fontSize: '12.5px', fontWeight: 600, color: BRAND.text }}>
                            {vendor.city || 'Surat'}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '11px',
                              color: BRAND.muted,
                              maxWidth: 160,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={vendor.address || ''}
                          >
                            {vendor.address || 'Location registered'}
                          </Typography>
                        </TableCell>

                        {/* Products */}
                        <TableCell align="center" onClick={(e) => { e.stopPropagation(); handleOpenProductsDialog(vendor); }}>
                          <Tooltip title="Manage store products">
                            <Chip
                              icon={<InventoryIcon sx={{ fontSize: '13px !important', color: vendorProductsCount > 0 ? `${BRAND.green} !important` : `${BRAND.muted} !important` }} />}
                              label={`${vendorProductsCount} ${vendorProductsCount === 1 ? 'item' : 'items'}`}
                              size="small"
                              clickable
                              sx={{
                                fontWeight: 700,
                                fontSize: '11px',
                                backgroundColor: vendorProductsCount > 0 ? BRAND.lightGreen : BRAND.innerCard,
                                color: vendorProductsCount > 0 ? BRAND.green : BRAND.muted,
                                borderRadius: '6px',
                                height: 24,
                              }}
                            />
                          </Tooltip>
                        </TableCell>

                        {/* Orders */}
                        <TableCell align="center" onClick={() => handleOpenViewDetails(vendor)}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1.2,
                              py: 0.3,
                              borderRadius: '6px',
                              backgroundColor: vendorOrdersCount > 0 ? BRAND.lightBlue : BRAND.innerCard,
                              color: vendorOrdersCount > 0 ? BRAND.blue : BRAND.muted,
                              fontSize: '11.5px',
                              fontWeight: 700,
                            }}
                          >
                            {vendorOrdersCount} {vendorOrdersCount === 1 ? 'order' : 'orders'}
                          </Box>
                        </TableCell>

                        {/* Status */}
                        <TableCell onClick={() => handleOpenViewDetails(vendor)}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.6,
                              px: 1.2,
                              py: 0.3,
                              borderRadius: '50px',
                              backgroundColor: isActive ? (isDark ? 'rgba(52,211,153,0.15)' : '#DCFCE7') : BRAND.redLight,
                              color: isActive ? BRAND.success || '#16A34A' : BRAND.red,
                              fontSize: '11.5px',
                              fontWeight: 700,
                            }}
                          >
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: isActive ? (BRAND.success || '#16A34A') : BRAND.red }} />
                            {isActive ? 'Active' : 'Blocked'}
                          </Box>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="View Store Details">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenViewDetails(vendor)}
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

                            <Tooltip title="Manage Products">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenProductsDialog(vendor)}
                                sx={{
                                  color: BRAND.green,
                                  backgroundColor: BRAND.lightGreen,
                                  borderRadius: '8px',
                                  width: 28,
                                  height: 28,
                                  '&:hover': { backgroundColor: isDark ? 'rgba(16,185,129,0.25)' : '#DCFCE7' },
                                }}
                              >
                                <InventoryIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            {canUpdateVendor && (
                              <Tooltip title="Edit Store">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(vendor)}
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
                            )}

                            {isSuperAdmin && (
                              <Tooltip title="Delete Store">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(vendor)}
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
            [1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: '12px' }} />)
          ) : paginatedVendors.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <StorefrontIcon sx={{ fontSize: 36, color: '#CBD5E1', display: 'block', mx: 'auto', mb: 1 }} />
              <Typography sx={{ color: BRAND.muted, fontSize: '13px' }}>No vendors found</Typography>
            </Box>
          ) : (
            paginatedVendors.map((vendor) => {
              const isActive = !vendor.isBlocked && vendor.status !== 0;
              const vendorProductsCount = allProducts.filter(
                (p) => (p.vendor_id?._id || p.vendor_id || p.vendor?._id || p.vendor) === vendor._id
              ).length;
              const vendorOrdersCount = allOrders.filter(
                (o) => (o.vendor?._id || o.vendor) === vendor._id
              ).length;

              return (
                <Paper
                  key={vendor._id}
                  elevation={0}
                  onClick={() => handleOpenViewDetails(vendor)}
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
                        src={vendor.vendor_image}
                        alt={vendor.name}
                        variant="rounded"
                        sx={{ width: 40, height: 40, borderRadius: '8px', border: `1px solid ${BRAND.border}` }}
                      >
                        <StorefrontIcon sx={{ fontSize: 20 }} />
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: BRAND.text }}>
                          {vendor.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', mt: 0.2 }}>
                          <Box sx={{ fontSize: '11px', fontWeight: 700, color: BRAND.green }}>
                            {vendor.module?.name || 'Store'}
                          </Box>
                          <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>&bull;</Typography>
                          <Typography sx={{ fontSize: '11px', color: isActive ? (BRAND.success || '#16A34A') : BRAND.red, fontWeight: 700 }}>
                            {isActive ? 'Active' : 'Blocked'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: BRAND.muted, pt: 0.5, borderTop: `1px solid ${BRAND.divider}` }}>
                    <Box>
                      <Typography sx={{ fontSize: '11.5px', color: BRAND.text, fontWeight: 600 }}>
                        {vendor.email || vendor.mobile_number || 'No contact'}
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: BRAND.muted }}>
                        {vendor.city || 'Surat'} &bull; {vendor.open_time ? `${vendor.open_time}–${vendor.close_time}` : '24h'}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: BRAND.green }}>
                        {vendorProductsCount} items
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: BRAND.blue, fontWeight: 600 }}>
                        {vendorOrdersCount} orders
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1, borderTop: `1px solid ${BRAND.divider}` }} onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="small"
                      onClick={() => handleOpenProductsDialog(vendor)}
                      sx={{ textTransform: 'none', fontSize: '11px', fontWeight: 700, color: BRAND.green, borderRadius: '6px', px: 1, py: 0.3, border: `1px solid ${BRAND.border}` }}
                    >
                      Products
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleOpenDialog(vendor)}
                      sx={{ textTransform: 'none', fontSize: '11px', fontWeight: 700, color: BRAND.text, borderRadius: '6px', px: 1, py: 0.3, border: `1px solid ${BRAND.border}` }}
                    >
                      Edit
                    </Button>
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
            borderTop: `1px solid ${BRAND.divider}`,
          }}
        >
          <Typography sx={{ fontSize: '12px', color: BRAND.muted, fontWeight: 600 }}>
            Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filteredVendors.length)} of {filteredVendors.length} vendors
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
      {/* 4. VIEW VENDOR DETAILS MODAL */}
      {/* ======================================================== */}
      <Dialog
        open={viewVendorDialog}
        onClose={handleCloseViewDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 0.5,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={viewingVendor?.vendor_image}
              variant="rounded"
              sx={{ width: 44, height: 44, borderRadius: '10px', bgcolor: BRAND.lightGreen, color: BRAND.green }}
            >
              <StorefrontIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
                {viewingVendor?.name || 'Store Details'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
                <Chip label={viewingVendor?.module?.name || 'General'} size="small" sx={{ bgcolor: BRAND.lightGreen, color: BRAND.green, fontWeight: 700, height: 20, fontSize: '11px' }} />
                <Chip label={viewingVendor?.isBlocked ? 'Blocked' : 'Active'} size="small" sx={{ bgcolor: viewingVendor?.isBlocked ? BRAND.redLight : '#DCFCE7', color: viewingVendor?.isBlocked ? BRAND.red : '#16A34A', fontWeight: 700, height: 20, fontSize: '11px' }} />
              </Box>
            </Box>
          </Box>
          <IconButton onClick={handleCloseViewDetails} size="small" sx={{ color: BRAND.muted }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5 }}>
          <Grid container spacing={2.5}>
            {/* Contact Information */}
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1.5, letterSpacing: '0.04em' }}>
                  Contact Information
                </Typography>
                <Stack spacing={1.2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ fontSize: 16, color: BRAND.muted }} />
                    <Typography sx={{ fontSize: '13px', color: BRAND.text, fontWeight: 600 }}>
                      {viewingVendor?.email || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ fontSize: 16, color: BRAND.muted }} />
                    <Typography sx={{ fontSize: '13px', color: BRAND.text, fontWeight: 600 }}>
                      {viewingVendor?.mobile_number || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationIcon sx={{ fontSize: 16, color: BRAND.muted, mt: 0.2 }} />
                    <Typography sx={{ fontSize: '12.5px', color: BRAND.text }}>
                      {viewingVendor?.address || 'Address not registered'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Operating & Logistics */}
            <Grid item xs={12} sm={6}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', bgcolor: BRAND.innerCard, border: `1px solid ${BRAND.border}` }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 800, color: BRAND.muted, textTransform: 'uppercase', mb: 1.5, letterSpacing: '0.04em' }}>
                  Operations & Fees
                </Typography>
                <Stack spacing={1.2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Operating Hours:</Typography>
                    <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: BRAND.text }}>
                      {viewingVendor?.open_time && viewingVendor?.close_time ? `${viewingVendor.open_time} – ${viewingVendor.close_time}` : 'Not configured'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Preparation Time:</Typography>
                    <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: BRAND.text }}>
                      {viewingVendor?.preparation_time_minute || 0} minutes
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Delivery Charge:</Typography>
                    <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: BRAND.green }}>
                      ₹{viewingVendor?.delivery_charge || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '12.5px', color: BRAND.muted }}>Packaging Charge:</Typography>
                    <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: BRAND.text }}>
                      ₹{viewingVendor?.packaging_charge || 0}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseViewDetails} sx={{ textTransform: 'none', color: BRAND.muted, fontWeight: 600 }}>
            Close
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => {
                const v = viewingVendor;
                handleCloseViewDetails();
                if (v) handleOpenProductsDialog(v);
              }}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', borderColor: BRAND.border, color: BRAND.green }}
            >
              Manage Products
            </Button>
            {canUpdateVendor && (
              <Button
                variant="contained"
                onClick={() => {
                  const v = viewingVendor;
                  handleCloseViewDetails();
                  if (v) handleOpenDialog(v);
                }}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', bgcolor: BRAND.green, '&:hover': { bgcolor: BRAND.darkGreen } }}
              >
                Edit Vendor
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* 5. ADD / EDIT VENDOR FORM MODAL (REDESIGNED) */}
      {/* ======================================================== */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth={false}
        fullWidth
        sx={{
          '& .MuiDialog-container': {
            p: { xs: 1, sm: 2.5 },
          },
          '& .MuiDialog-paper': {
            width: '100%',
            maxWidth: '1120px',
            height: { xs: 'calc(100% - 16px)', sm: '90vh' },
            maxHeight: '90vh',
            borderRadius: '22px',
            backgroundColor: BRAND.white,
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            m: 0,
          },
        }}
      >
        {/* Sticky Modal Header */}
        <DialogTitle
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: BRAND.white,
            borderBottom: `1px solid ${BRAND.divider}`,
            px: { xs: 2.5, sm: 3.5 },
            py: 2.2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.2rem', sm: '1.35rem' },
                  color: BRAND.text,
                  letterSpacing: '-0.02em',
                }}
              >
                {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </Typography>
              <Chip
                label={selectedVendor ? 'Editing Mode' : 'Store Onboarding'}
                size="small"
                sx={{
                  backgroundColor: selectedVendor ? BRAND.lightBlue : BRAND.lightGreen,
                  color: selectedVendor ? BRAND.blue : BRAND.green,
                  fontWeight: 700,
                  fontSize: '11px',
                  height: 22,
                  borderRadius: '6px',
                  border: `1px solid ${selectedVendor ? BRAND.borderBlue : BRAND.borderGreen}`,
                }}
              />
            </Box>
            <Typography sx={{ fontSize: '12.5px', color: BRAND.muted, mt: 0.3 }}>
              {selectedVendor
                ? 'Update vendor profile, operating hours and marketplace fee configurations'
                : 'Create a new neighborhood store partner on AapnuBazaar'}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
            size="small"
            sx={{
              color: BRAND.muted,
              backgroundColor: BRAND.innerCard,
              border: `1px solid ${BRAND.border}`,
              borderRadius: '10px',
              width: 34,
              height: 34,
              '&:hover': {
                backgroundColor: BRAND.divider,
                color: BRAND.text,
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        {/* Scrollable Form Body */}
        <DialogContent
          sx={{
            p: { xs: 2, sm: 3.5 },
            overflowY: 'auto',
            backgroundColor: BRAND.adminBg,
            flexGrow: 1,
          }}
        >
          <Stack spacing={3.5}>
            {/* ── SECTION 1: VENDOR LOCATION ── */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: '18px',
                border: `1px solid ${BRAND.border}`,
                backgroundColor: BRAND.white,
              }}
            >
              {/* Section Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '9px',
                    backgroundColor: BRAND.lightGreen,
                    color: BRAND.green,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: `1px solid ${BRAND.borderGreen}`,
                  }}
                >
                  1
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
                    Vendor Location
                  </Typography>
                  <Typography sx={{ fontSize: '11.5px', color: BRAND.muted }}>
                    Set precise GPS location for dispatch routing and neighborhood customer discovery
                  </Typography>
                </Box>
              </Box>

              {/* Location Search Toolbar */}
              <Box sx={{ display: 'flex', gap: 1.2, mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search locality, landmark or address on Google Maps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleMapSearch();
                    }
                  }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: BRAND.muted, fontSize: 20 }} />,
                    sx: {
                      borderRadius: '12px',
                      fontSize: '13.5px',
                      backgroundColor: BRAND.inputBg,
                      '& fieldset': { borderColor: BRAND.border },
                      '&:hover fieldset': { borderColor: BRAND.green },
                      '&.Mui-focused fieldset': { borderColor: BRAND.green },
                    },
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleMapSearch}
                  disabled={searching || !searchQuery.trim()}
                  sx={{
                    minWidth: 90,
                    borderColor: BRAND.border,
                    color: BRAND.text,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '13px',
                    borderRadius: '12px',
                    px: 2.5,
                    '&:hover': { borderColor: BRAND.green, backgroundColor: BRAND.lightGreen },
                  }}
                >
                  {searching ? <CircularProgress size={18} /> : 'Search'}
                </Button>
                <Button
                  variant="contained"
                  onClick={getCurrentLocation}
                  sx={{
                    minWidth: 46,
                    backgroundColor: BRAND.green,
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(8, 127, 91, 0.2)',
                    '&:hover': { backgroundColor: BRAND.darkGreen },
                  }}
                  title="Detect Current Location (GPS)"
                >
                  <MyLocationIcon sx={{ fontSize: 20 }} />
                </Button>
              </Box>

              {/* Google Maps Container */}
              <Box
                ref={mapRef}
                sx={{
                  width: '100%',
                  height: { xs: 230, sm: 280 },
                  borderRadius: '16px',
                  border: `1.5px solid ${BRAND.border}`,
                  backgroundColor: BRAND.innerCard,
                  mb: 1.5,
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}
              />

              {/* Helper text & Coordinates Badge */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 1,
                }}
              >
                <Typography sx={{ fontSize: '11.5px', color: BRAND.muted, fontWeight: 500 }}>
                  Click anywhere on the map or drag the marker to fine-tune the exact storefront location.
                </Typography>

                {formData.latitude && formData.longitude && (
                  <Box
                    sx={{
                      px: 1.8,
                      py: 0.6,
                      borderRadius: '50px',
                      backgroundColor: BRAND.lightGreen,
                      border: `1px solid ${BRAND.borderGreen}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: BRAND.green }} />
                    <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: BRAND.green, fontFamily: 'monospace' }}>
                      Lat: {parseFloat(formData.latitude).toFixed(5)}, Lng: {parseFloat(formData.longitude).toFixed(5)}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* ── SECTION 2: BASIC INFORMATION ── */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: '18px',
                border: `1px solid ${BRAND.border}`,
                backgroundColor: BRAND.white,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '9px',
                    backgroundColor: BRAND.lightBlue,
                    color: BRAND.blue,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: `1px solid ${BRAND.borderBlue}`,
                  }}
                >
                  2
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
                    Basic Information
                  </Typography>
                  <Typography sx={{ fontSize: '11.5px', color: BRAND.muted }}>
                    Primary merchant identity, category taxonomy and contact credentials
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Store Name *"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Royal Fresh Mart"
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Owner Email *"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="merchant@example.com"
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mobile Number *"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleInputChange}
                    required
                    placeholder="10-digit phone number"
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Category / Module *"
                    name="module"
                    value={formData.module}
                    onChange={handleInputChange}
                    required
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  >
                    {modules.map((m) => (
                      <MenuItem key={m._id} value={m._id} sx={{ fontSize: '13px', fontWeight: 600 }}>
                        {m.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Store Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    placeholder="Describe store specialties, fresh products, organic options and service guarantees..."
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* ── SECTION 3: STORE IMAGE & FULL ADDRESS ── */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: '18px',
                border: `1px solid ${BRAND.border}`,
                backgroundColor: BRAND.white,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '9px',
                    backgroundColor: BRAND.lightOrange,
                    color: BRAND.orange,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: `1px solid ${BRAND.borderOrange}`,
                  }}
                >
                  3
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
                    Store Image & Full Address
                  </Typography>
                  <Typography sx={{ fontSize: '11.5px', color: BRAND.muted }}>
                    Branded storefront banner and detailed customer-facing address
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {/* Store Image Upload Area */}
                <Grid item xs={12} md={4.5}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: BRAND.text, mb: 1 }}>
                    Storefront Photo
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '16px',
                      border: `1.5px dashed ${imagePreview ? BRAND.green : BRAND.border}`,
                      backgroundColor: imagePreview ? (isDark ? 'rgba(16,185,129,0.1)' : '#F4FBF7') : BRAND.innerCard,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      minHeight: 180,
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: BRAND.green,
                        backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#F4FBF7',
                      },
                    }}
                  >
                    {imagePreview ? (
                      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          src={imagePreview}
                          variant="rounded"
                          sx={{
                            width: '100%',
                            height: 110,
                            borderRadius: '12px',
                            border: `1px solid ${BRAND.borderGreen}`,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          }}
                        />
                        <Button
                          variant="outlined"
                          component="label"
                          size="small"
                          startIcon={<UploadIcon />}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '12px',
                            borderRadius: '10px',
                            borderColor: BRAND.borderGreen,
                            color: BRAND.green,
                            backgroundColor: BRAND.white,
                            '&:hover': { borderColor: BRAND.green, backgroundColor: BRAND.lightGreen },
                          }}
                        >
                          Change Photo
                          <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: '14px',
                            backgroundColor: BRAND.innerCard,
                            border: `1px solid ${BRAND.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                          }}
                        >
                          <StorefrontIcon sx={{ color: BRAND.muted, fontSize: 26 }} />
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: BRAND.text }}>
                            Drag & drop or upload
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: BRAND.muted, mt: 0.2 }}>
                            PNG, JPG or WebP (max 5MB)
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          component="label"
                          size="small"
                          startIcon={<UploadIcon />}
                          sx={{
                            mt: 0.5,
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '12px',
                            borderRadius: '10px',
                            borderColor: BRAND.border,
                            color: BRAND.text,
                            backgroundColor: BRAND.white,
                            '&:hover': { borderColor: BRAND.green, color: BRAND.green, backgroundColor: BRAND.lightGreen },
                          }}
                        >
                          Upload Image
                          <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Full Address Input */}
                <Grid item xs={12} md={7.5}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: BRAND.text, mb: 1 }}>
                    Full Store Address *
                  </Typography>
                  <TextField
                    fullWidth
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    inputRef={addressInputRef}
                    multiline
                    rows={4}
                    placeholder="Shop No., Complex name, Street, Landmark, Area, City, Pincode..."
                    helperText="Use the complete address customers can use to find the store on order receipts."
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* ── SECTION 4: OPERATING HOURS ── */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: '18px',
                border: `1px solid ${BRAND.border}`,
                backgroundColor: BRAND.white,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '9px',
                    backgroundColor: BRAND.innerCard,
                    color: BRAND.text,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: `1px solid ${BRAND.border}`,
                  }}
                >
                  4
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
                    Operating Hours & Status
                  </Typography>
                  <Typography sx={{ fontSize: '11.5px', color: BRAND.muted }}>
                    Store operational schedule and active marketplace visibility
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Opening Time"
                    name="open_time"
                    type="time"
                    value={formData.open_time}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Closing Time"
                    name="close_time"
                    type="time"
                    value={formData.close_time}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Preparation Time"
                    name="preparation_time_minute"
                    type="number"
                    value={formData.preparation_time_minute}
                    onChange={handleInputChange}
                    helperText="Average kitchen / packing time (minutes)"
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    select
                    label="Store Status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  >
                    <MenuItem value={1} sx={{ fontSize: '13px', fontWeight: 600, color: '#16A34A' }}>
                      Active (Live on App)
                    </MenuItem>
                    <MenuItem value={0} sx={{ fontSize: '13px', fontWeight: 600, color: BRAND.red }}>
                      Inactive (Suspended)
                    </MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </Paper>

            {/* ── SECTION 5: MARKETPLACE CHARGES ── */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: '18px',
                border: `1px solid ${BRAND.border}`,
                backgroundColor: BRAND.white,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '9px',
                    backgroundColor: BRAND.lightGreen,
                    color: BRAND.green,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '13px',
                    border: `1px solid ${BRAND.borderGreen}`,
                  }}
                >
                  5
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '14px', color: BRAND.text }}>
                    Marketplace Charges & Customer Fees
                  </Typography>
                  <Typography sx={{ fontSize: '11.5px', color: BRAND.muted }}>
                    Default delivery, packaging and convenience rates applied to shopper checkouts
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Delivery Charge (₹)"
                    name="delivery_charge"
                    type="number"
                    value={formData.delivery_charge}
                    onChange={handleInputChange}
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Packaging Fee (₹)"
                    name="packaging_charge"
                    type="number"
                    value={formData.packaging_charge}
                    onChange={handleInputChange}
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Platform / Convenience Fee (₹)"
                    name="convenience_charge"
                    type="number"
                    value={formData.convenience_charge}
                    onChange={handleInputChange}
                    InputProps={{
                      sx: {
                        borderRadius: '12px',
                        fontSize: '13.5px',
                        '& fieldset': { borderColor: BRAND.border },
                        '&:hover fieldset': { borderColor: BRAND.green },
                        '&.Mui-focused fieldset': { borderColor: BRAND.green },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </DialogContent>

        {/* Sticky Modal Footer */}
        <DialogActions
          sx={{
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            backgroundColor: BRAND.white,
            borderTop: `1px solid ${BRAND.divider}`,
            px: { xs: 2.5, sm: 3.5 },
            py: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            onClick={handleCloseDialog}
            disabled={submitting}
            sx={{
              textTransform: 'none',
              color: BRAND.muted,
              fontWeight: 700,
              fontSize: '13.5px',
              borderRadius: '12px',
              px: 2.5,
              py: 1,
              '&:hover': {
                backgroundColor: BRAND.innerCard,
                color: BRAND.text,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !formData.name || !formData.email || !formData.mobile_number}
            sx={{
              backgroundColor: BRAND.green,
              color: '#FFFFFF',
              textTransform: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '13.5px',
              px: 4,
              py: 1.15,
              boxShadow: '0 4px 14px rgba(8, 127, 91, 0.25)',
              '&:hover': {
                backgroundColor: BRAND.darkGreen,
                boxShadow: '0 6px 18px rgba(8, 127, 91, 0.35)',
              },
              '&:disabled': {
                backgroundColor: isDark ? '#334155' : '#CBD5E1',
                color: '#94A3B8',
              },
            }}
          >
            {submitting ? (
              <CircularProgress size={20} color="inherit" />
            ) : selectedVendor ? (
              'Save Changes'
            ) : (
              'Create Vendor'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* 6. DELETE VENDOR CONFIRMATION DIALOG */}
      {/* ======================================================== */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} PaperProps={{ sx: { borderRadius: '14px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
          Delete Vendor?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: BRAND.muted }}>
            Are you sure you want to delete <strong>{selectedVendor?.name}</strong>? This action cannot be undone and will remove associated catalog links.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setDeleteDialog(false)} disabled={submitting} sx={{ textTransform: 'none', color: BRAND.muted }}>
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
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Delete Vendor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ======================================================== */}
      {/* 7. PRODUCTS MANAGEMENT DIALOG */}
      {/* ======================================================== */}
      <Dialog
        open={productsDialog}
        onClose={() => setProductsDialog(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '16px',
            margin: { xs: 1, sm: 3 },
            maxHeight: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 48px)' },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem', color: BRAND.text }}>
              Store Catalog: {currentVendor?.name}
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: BRAND.muted }}>
              Manage products, prices and inventory for this vendor
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {canManageProducts && (
              <Button
                variant="contained"
                startIcon={<AddIcon sx={{ fontSize: '16px !important' }} />}
                onClick={() => handleOpenProductForm()}
                size="small"
                sx={{
                  backgroundColor: BRAND.green,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '12px',
                  borderRadius: '8px',
                  '&:hover': { backgroundColor: BRAND.darkGreen },
                }}
              >
                + Add Product
              </Button>
            )}
            <IconButton onClick={() => setProductsDialog(false)} size="small" sx={{ color: BRAND.muted }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {loadingProducts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress sx={{ color: BRAND.green }} />
            </Box>
          ) : products.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <InventoryIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1, display: 'block', mx: 'auto' }} />
              <Typography sx={{ color: BRAND.text, fontWeight: 700, fontSize: '14px' }}>
                No products found
              </Typography>
              <Typography sx={{ color: BRAND.muted, fontSize: '12px', mt: 0.3, mb: 1.5 }}>
                Add products to start accepting customer orders for this store.
              </Typography>
              {canManageProducts && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenProductForm()}
                  size="small"
                  sx={{ backgroundColor: BRAND.green, textTransform: 'none', fontWeight: 700, borderRadius: '8px', '&:hover': { backgroundColor: BRAND.darkGreen } }}
                >
                  Add Product
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: `1.5px solid ${BRAND.border}`, color: BRAND.muted, fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', py: 1.2 } }}>
                    <TableCell>Product</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Special Price</TableCell>
                    <TableCell>Prep Time</TableCell>
                    <TableCell>Pack Fee</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id} hover sx={{ '& td': { borderBottom: `1px solid ${BRAND.divider}`, py: 1.2 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar src={product.image} alt={product.name} variant="rounded" sx={{ width: 32, height: 32, borderRadius: '6px' }} />
                          <Typography sx={{ fontWeight: 700, fontSize: '12.5px', color: BRAND.text }}>{product.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography sx={{ fontWeight: 800, color: BRAND.text, fontSize: '12.5px' }}>₹{product.main_price}</Typography></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 600, color: BRAND.orange, fontSize: '12px' }}>{product.special_price ? `₹${product.special_price}` : '—'}</Typography></TableCell>
                      <TableCell><Typography sx={{ color: BRAND.muted, fontSize: '12px' }}>{product.preparation_time_minute} min</Typography></TableCell>
                      <TableCell><Typography sx={{ color: BRAND.muted, fontSize: '12px' }}>₹{product.packaging_charge}</Typography></TableCell>
                      <TableCell>
                        <Chip
                          label={product.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{
                            bgcolor: product.isActive ? (isDark ? 'rgba(52,211,153,0.15)' : '#DCFCE7') : BRAND.redLight,
                            color: product.isActive ? (BRAND.success || '#16A34A') : BRAND.red,
                            fontWeight: 700,
                            fontSize: '10.5px',
                            height: 20,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {canManageProducts && (
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <IconButton size="small" onClick={() => handleOpenProductForm(product)} sx={{ color: BRAND.muted, borderRadius: '6px', '&:hover': { color: BRAND.text, bgcolor: BRAND.innerCard } }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleProductDeleteClick(product)} sx={{ color: BRAND.red, borderRadius: '6px', '&:hover': { bgcolor: BRAND.redLight } }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* Product Form Dialog (Add/Edit) */}
      <Dialog
        open={productFormDialog}
        onClose={handleCloseProductForm}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', p: 0.5 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', color: BRAND.text }}>
            {selectedProduct ? 'Edit Product' : 'Add New Product'}
          </Typography>
          <IconButton onClick={handleCloseProductForm} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              {productImagePreview && (
                <Avatar src={productImagePreview} variant="rounded" sx={{ width: 90, height: 90, mx: 'auto', mb: 1, borderRadius: '10px' }} />
              )}
              <Button variant="outlined" component="label" size="small" startIcon={<UploadIcon />} sx={{ borderRadius: '8px', textTransform: 'none', fontSize: '12px' }}>
                {productImagePreview ? 'Replace Product Image' : 'Upload Product Image'}
                <input type="file" hidden accept="image/*" onChange={handleProductImageChange} />
              </Button>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Product Name *" name="name" value={productFormData.name} onChange={handleProductInputChange} required InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Main Price (₹) *" name="main_price" type="number" value={productFormData.main_price} onChange={handleProductInputChange} required InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Special Price (₹)" name="special_price" type="number" value={productFormData.special_price} onChange={handleProductInputChange} InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Prep Time (mins)" name="preparation_time_minute" type="number" value={productFormData.preparation_time_minute} onChange={handleProductInputChange} InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth size="small" label="Packaging Fee (₹)" name="packaging_charge" type="number" value={productFormData.packaging_charge} onChange={handleProductInputChange} InputProps={{ sx: { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" select label="Status" name="isActive" value={productFormData.isActive.toString()} onChange={(e) => setProductFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))} InputProps={{ sx: { borderRadius: '8px' } }}>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 1.5, justifyContent: 'space-between' }}>
          <Button onClick={handleCloseProductForm} disabled={submitting} sx={{ textTransform: 'none', color: BRAND.muted }}>Cancel</Button>
          <Button variant="contained" onClick={handleProductSubmit} disabled={submitting} sx={{ backgroundColor: BRAND.green, textTransform: 'none', borderRadius: '8px', fontWeight: 700, '&:hover': { backgroundColor: BRAND.darkGreen } }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : selectedProduct ? 'Save Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Delete Confirmation Dialog */}
      <Dialog open={productDeleteDialog} onClose={() => setProductDeleteDialog(false)} PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem' }}>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '13px', color: BRAND.muted }}>
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setProductDeleteDialog(false)} disabled={submitting} sx={{ textTransform: 'none', color: BRAND.muted }}>Cancel</Button>
          <Button variant="contained" onClick={handleProductDeleteConfirm} disabled={submitting} sx={{ bgcolor: BRAND.red, color: '#FFFFFF', fontWeight: 700, textTransform: 'none', borderRadius: '8px', '&:hover': { bgcolor: '#B91C1C' } }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Delete Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vendors;
