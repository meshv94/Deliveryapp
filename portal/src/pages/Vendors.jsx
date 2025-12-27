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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  MyLocation as MyLocationIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import vendorService from '../services/vendorService';

const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
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

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    mobile_number: '',
    address: '',
    latitude: '',
    longitude: '',
    // city: '',
    // pincode: '',
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

  const GOOGLE_MAPS_API_KEY = 'AIzaSyCt-3lkaKLavZB1iAu_yjkO3tTjBOCvrpM';

  // Fetch vendors and modules on mount
  useEffect(() => {
    fetchVendors();
    fetchModules();
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!openDialog) return;

    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
    };
    document.head.appendChild(script);
  }, [openDialog]);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !openDialog || !mapRef.current) return;

    const defaultCenter = currentLocation || { lat: 28.6139, lng: 77.209 }; // Default to Delhi

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
      const response = await vendorService.getAllVendors();
      setVendors(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/modules/active/list');
      const data = await response.json();
      if (data.success) {
        setModules(data.data || []);
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
        // city: vendor.city || '',
        // pincode: vendor.pincode || '',
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

      // Set map location if coordinates exist
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
        // city: '',
        // pincode: '',
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
      setImagePreview(null);
      setCurrentLocation(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVendor(null);
    setFormData({
      name: '',
      email: '',
      description: '',
      mobile_number: '',
      address: '',
      latitude: '',
      longitude: '',
      // city: '',
      // pincode: '',
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
    setImagePreview(null);
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

      // Extract city and pincode from address components
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

      // Update map marker and center
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
          alert('Unable to get your location. Please allow location access.');
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
        setSearchQuery(''); // Clear search after successful search
      } else {
        alert('Location not found. Please try a different search.');
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Create FormData
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('description', formData.description);
      data.append('mobile_number', formData.mobile_number);
      data.append('address', formData.address);
      data.append('latitude', formData.latitude);
      data.append('longitude', formData.longitude);
      // data.append('city', formData.city);
      // data.append('pincode', formData.pincode);
      data.append('open_time', formData.open_time);
      data.append('close_time', formData.close_time);
      data.append('timezone', formData.timezone);
      data.append('preparation_time_minute', formData.preparation_time_minute);
      data.append('packaging_charge', formData.packaging_charge);
      data.append('delivery_charge', formData.delivery_charge);
      data.append('convenience_charge', formData.convenience_charge);
      data.append('status', formData.status);
      data.append('module', formData.module);

      if (formData.vendor_image) {
        data.append('vendor_image', formData.vendor_image);
      }

      if (selectedVendor) {
        // Update
        await vendorService.updateVendor(selectedVendor._id, data);
        setSuccess('Vendor updated successfully!');
      } else {
        // Create
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
    setProductFormData({
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
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#667eea' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
          Vendors Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Add Vendor
        </Button>
      </Box>

      {/* Vendors Table */}
      <TableContainer component={Paper} sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '100%', overflowX: 'auto' }}>
        <Table sx={{ minWidth: { xs: 300, sm: 650 } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
              <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vendor Name</TableCell>
              <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 700, display: { xs: 'none', lg: 'table-cell' } }}>City</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No vendors found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor._id} hover>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Avatar src={vendor.vendor_image} alt={vendor.name} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{vendor.name}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{vendor.email}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{vendor.mobile_number}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{vendor.city}</TableCell>
                  <TableCell>
                    <Chip
                      label={vendor.isBlocked ? 'Blocked' : 'Active'}
                      size="small"
                      color={vendor.isBlocked ? 'error' : 'success'}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenProductsDialog(vendor)}
                        title="View Products"
                      >
                        <InventoryIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="info" onClick={() => handleOpenDialog(vendor)} title="Edit Vendor">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(vendor)} title="Delete Vendor">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
          </Typography>
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Map Section - Full Width */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>
                Select Location on Map
              </Typography>

              {/* Search Bar */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search for a location on map..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleMapSearch();
                    }
                  }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: '#667eea' }} />,
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleMapSearch}
                  disabled={searching || !searchQuery.trim()}
                  sx={{
                    minWidth: 100,
                    borderColor: '#667eea',
                    color: '#667eea',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#5568d3',
                      backgroundColor: 'rgba(102, 126, 234, 0.05)',
                    },
                  }}
                >
                  {searching ? <CircularProgress size={20} /> : 'Search'}
                </Button>
                <Button
                  variant="contained"
                  onClick={getCurrentLocation}
                  sx={{
                    minWidth: 50,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
                    },
                  }}
                >
                  <MyLocationIcon />
                </Button>
              </Box>

              {/* Google Map */}
              <Box
                ref={mapRef}
                sx={{
                  width: '100%',
                  height: 300,
                  borderRadius: 2,
                  border: '2px solid #e0e0e0',
                  backgroundColor: '#f5f5f5',
                  mb: 1,
                }}
              />
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 2 }}>
                Click on the map or drag the marker to select vendor location
              </Typography>

              {/* Coordinates Display */}
              {formData.latitude && formData.longitude && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: '#f5f7fa',
                    border: '1px solid #e0e0e0',
                    mb: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Selected Coordinates:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    Lat: {formData.latitude}, Lng: {formData.longitude}
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#667eea', mb: 1, mt: 2 }}>
                Basic Information
              </Typography>
            </Grid>

            {/* Image Upload and Vendor Name side by side */}
            <Grid item xs={12} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                {imagePreview && (
                  <Avatar
                    src={imagePreview}
                    sx={{ width: 100, height: 100, mx: 'auto', mb: 1 }}
                  />
                )}
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  size="small"
                  sx={{ width: '100%' }}
                >
                  Upload Image
                  <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} sm={9}>
              <TextField
                fullWidth
                label="Vendor Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mobile Number"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>

            {/* Location Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#667eea', mb: 1, mt: 2 }}>
                Location Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                inputRef={addressInputRef}
                placeholder="Search for a location..."
              />
            </Grid>

            {/* Pricing */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#667eea', mb: 1, mt: 2 }}>
                Pricing & Charges
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Packaging Charge"
                name="packaging_charge"
                type="number"
                value={formData.packaging_charge}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Delivery Charge"
                name="delivery_charge"
                type="number"
                value={formData.delivery_charge}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Convenience Charge"
                name="convenience_charge"
                type="number"
                value={formData.convenience_charge}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Operating Hours */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#667eea', mb: 1, mt: 2 }}>
                Operating Hours
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Opening Time"
                name="open_time"
                type="time"
                value={formData.open_time}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
                helperText="24-hour format (HH:mm)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Closing Time"
                name="close_time"
                type="time"
                value={formData.close_time}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
                helperText="24-hour format (HH:mm)"
              />
            </Grid>

            {/* Module & Configuration */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#667eea', mb: 1, mt: 2 }}>
                Module & Configuration
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Module"
                name="module"
                value={formData.module}
                onChange={handleInputChange}
                required
                helperText="Select the module/category for this vendor"
              >
                {modules.map((module) => (
                  <MenuItem key={module._id} value={module._id}>
                    {module.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Timezone */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
              >
                <MenuItem value="Asia/Kolkata">Asia/Kolkata</MenuItem>
                <MenuItem value="Asia/Bangalore">Asia/Bangalore</MenuItem>
                <MenuItem value="UTC">UTC</MenuItem>
              </TextField>
            </Grid>

            {/* Preparation Time */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preparation Time (minutes)"
                name="preparation_time_minute"
                type="number"
                value={formData.preparation_time_minute}
                onChange={handleInputChange}
                helperText="Average time to prepare orders"
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={0}>Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : selectedVendor ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete Vendor?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedVendor?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Products Management Dialog */}
      <Dialog
        open={productsDialog}
        onClose={() => setProductsDialog(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 1, sm: 3 },
            maxHeight: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, pb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Products - {currentVendor?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Manage products for this vendor
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenProductForm()}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                textTransform: 'none',
                fontWeight: 600,
                display: { xs: 'none', sm: 'flex' },
              }}
            >
              Add Product
            </Button>
            <IconButton
              onClick={() => handleOpenProductForm()}
              sx={{
                display: { xs: 'flex', sm: 'none' },
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
                },
              }}
              size="small"
            >
              <AddIcon />
            </IconButton>
            <IconButton onClick={() => setProductsDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {loadingProducts ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: '#667eea' }} />
            </Box>
          ) : products.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <InventoryIcon sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Products Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add your first product to get started
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenProductForm()}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Add Product
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
              <Table sx={{ minWidth: { xs: 300, sm: 600 } }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Image</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Product Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Main Price</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Special Price</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', lg: 'table-cell' } }}>Prep Time</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', lg: 'table-cell' } }}>Pack Charge</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id} hover>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Avatar src={product.image} alt={product.name} variant="rounded" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{product.name}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>₹{product.main_price}</TableCell>
                      <TableCell sx={{ fontWeight: 600, display: { xs: 'none', md: 'table-cell' } }}>
                        {product.special_price ? `₹${product.special_price}` : '-'}
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        {product.preparation_time_minute} min
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        ₹{product.packaging_charge}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={product.isActive ? 'success' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          <IconButton size="small" color="info" onClick={() => handleOpenProductForm(product)} title="Edit Product">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleProductDeleteClick(product)} title="Delete Product">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
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
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 2, sm: 3 },
            maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {selectedProduct ? 'Edit Product' : 'Add New Product'}
          </Typography>
          <IconButton onClick={handleCloseProductForm}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Image Upload */}
            <Grid item xs={12} sx={{ textAlign: 'center' }}>
              {productImagePreview && (
                <Avatar
                  src={productImagePreview}
                  variant="rounded"
                  sx={{ width: 150, height: 150, mx: 'auto', mb: 2 }}
                />
              )}
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ width: '100%' }}
              >
                Upload Product Image
                <input type="file" hidden accept="image/*" onChange={handleProductImageChange} />
              </Button>
            </Grid>

            {/* Product Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={productFormData.name}
                onChange={handleProductInputChange}
                required
              />
            </Grid>

            {/* Main Price */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Main Price"
                name="main_price"
                type="number"
                value={productFormData.main_price}
                onChange={handleProductInputChange}
                required
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                }}
              />
            </Grid>

            {/* Special Price */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Special Price (Optional)"
                name="special_price"
                type="number"
                value={productFormData.special_price}
                onChange={handleProductInputChange}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                }}
                helperText="Leave empty if no special price"
              />
            </Grid>

            {/* Preparation Time */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preparation Time (minutes)"
                name="preparation_time_minute"
                type="number"
                value={productFormData.preparation_time_minute}
                onChange={handleProductInputChange}
                helperText="Time required to prepare this product"
              />
            </Grid>

            {/* Packaging Charge */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Packaging Charge"
                name="packaging_charge"
                type="number"
                value={productFormData.packaging_charge}
                onChange={handleProductInputChange}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Status"
                name="isActive"
                value={productFormData.isActive.toString()}
                onChange={(e) =>
                  setProductFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))
                }
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseProductForm} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleProductSubmit}
            disabled={submitting}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : selectedProduct ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Product Delete Confirmation Dialog */}
      <Dialog open={productDeleteDialog} onClose={() => setProductDeleteDialog(false)}>
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProductDeleteDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleProductDeleteConfirm}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vendors;
