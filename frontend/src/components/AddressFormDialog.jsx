import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Grid,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';

const AddressFormDialog = ({
  open,
  onClose,
  onSubmit,
  initialData = null,
  submitting = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    mobile_number: '',
    pincode: '',
    address: '',
    city: '',
    type: 'home',
    isDefault: false,
    latitude: null,
    longitude: null,
  });

  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Google Maps API Key
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCpAhl9zWxIfigpQ17hkcgjHoKPNDP07pI';

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        mobile_number: initialData.mobile_number || '',
        pincode: initialData.pincode || '',
        address: initialData.address || '',
        city: initialData.city || '',
        type: initialData.type || 'home',
        isDefault: initialData.isDefault || false,
        latitude: initialData.latitude || null,
        longitude: initialData.longitude || null,
      });
      if (initialData.latitude && initialData.longitude) {
        setCurrentLocation({
          lat: Number(initialData.latitude),
          lng: Number(initialData.longitude),
        });
      }
    } else {
      setFormData({
        name: '',
        mobile_number: '',
        pincode: '',
        address: '',
        city: '',
        type: 'home',
        isDefault: false,
        latitude: null,
        longitude: null,
      });
      setCurrentLocation(null);
    }
  }, [initialData, open]);

  // Load Google Maps Script
  useEffect(() => {
    if (!open) return;

    if (window.google && window.google.maps && window.google.maps.places) {
      setMapLoaded(true);
      return;
    }

    // Check if script exists
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
    script.onerror = () => {
      console.error('Failed to load Google Maps SDK');
    };
    document.head.appendChild(script);
  }, [open, GOOGLE_MAPS_API_KEY]);

  // Initialize Map & Autocomplete
  useEffect(() => {
    if (!mapLoaded || !open || !mapRef.current || !window.google?.maps) return;

    const defaultCenter = currentLocation || { lat: 23.0225, lng: 72.5714 }; // Default Ahmedabad / current

    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;

    const marker = new window.google.maps.Marker({
      position: defaultCenter,
      map: map,
      draggable: true,
      title: 'Delivery Location',
      animation: window.google.maps.Animation.DROP,
    });
    markerRef.current = marker;

    // Attach Autocomplete to Search Input
    if (searchInputRef.current && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'in' },
      });
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place || !place.geometry) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const latLng = { lat, lng };

        map.setCenter(latLng);
        map.setZoom(16);
        marker.setPosition(latLng);
        setCurrentLocation(latLng);

        let city = '';
        let pincode = '';
        place.address_components?.forEach((c) => {
          if (c.types.includes('locality')) city = c.long_name;
          if (c.types.includes('postal_code')) pincode = c.long_name;
        });

        setFormData((prev) => ({
          ...prev,
          address: place.formatted_address || prev.address,
          city: city || prev.city,
          pincode: pincode || prev.pincode,
          latitude: lat,
          longitude: lng,
        }));
      });
    }

    // Update location when marker is dragged
    marker.addListener('dragend', () => {
      const position = marker.getPosition();
      const lat = position.lat();
      const lng = position.lng();
      setCurrentLocation({ lat, lng });
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
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
        latitude: lat,
        longitude: lng,
      }));
      reverseGeocode(lat, lng);
    });

    // Auto-detect location if adding new address
    if (!initialData && !currentLocation) {
      getCurrentLocation();
    }
  }, [mapLoaded, open]);

  // Reverse Geocode to get address from coordinates
  const reverseGeocode = async (lat, lng) => {
    try {
      if (window.google?.maps?.Geocoder) {
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat, lng };

        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
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
              address: results[0].formatted_address || prev.address,
              city: city || prev.city,
              pincode: pincode || prev.pincode,
              latitude: lat,
              longitude: lng,
            }));
          }
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  // Get user's current location with high accuracy
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const latLng = { lat, lng };

        setCurrentLocation(latLng);
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(latLng);
          mapInstanceRef.current.setZoom(16);
        }
        if (markerRef.current) {
          markerRef.current.setPosition(latLng);
        }

        reverseGeocode(lat, lng);
      },
      (error) => {
        setLocating(false);
        console.warn('Geolocation notice:', error.message);
        // Fallback default coordinates if denied
        if (!currentLocation) {
          const fallback = { lat: 23.0225, lng: 72.5714 };
          setCurrentLocation(fallback);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Search for location via Geocoder
  const handleSearch = async () => {
    if (!searchQuery.trim() || !window.google?.maps?.Geocoder) return;

    setSearching(true);
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ address: searchQuery }, (results, status) => {
      setSearching(false);
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const latLng = { lat, lng };

        setCurrentLocation(latLng);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(latLng);
          mapInstanceRef.current.setZoom(16);
        }
        if (markerRef.current) {
          markerRef.current.setPosition(latLng);
        }

        let city = '';
        let pincode = '';
        results[0].address_components?.forEach((c) => {
          if (c.types.includes('locality')) city = c.long_name;
          if (c.types.includes('postal_code')) pincode = c.long_name;
        });

        setFormData((prev) => ({
          ...prev,
          address: results[0].formatted_address || prev.address,
          city: city || prev.city,
          pincode: pincode || prev.pincode,
          latitude: lat,
          longitude: lng,
        }));
      } else {
        alert('Location not found. Please try a different query or select on map.');
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'isDefault' ? checked : value,
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.mobile_number || !formData.pincode || !formData.address) {
      alert('Please fill all required fields');
      return;
    }

    // Save active delivery address to localStorage
    try {
      localStorage.setItem('activeDeliveryAddress', JSON.stringify({
        ...formData,
        displayLabel: formData.city ? `${formData.city}, ${formData.pincode}` : formData.address,
      }));
      if (formData.city) {
        localStorage.setItem('userCity', formData.city);
      }
      window.dispatchEvent(new Event('address_updated'));
    } catch (e) {
      console.error(e);
    }

    onSubmit(formData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '20px', overflow: 'hidden' },
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: '#087F5B',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 3,
          py: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.15rem' }}>
          {initialData ? 'Edit Address' : 'Add New Address'}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#fff' }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 3 }}>
        <Stack spacing={2.5}>
          {/* Map Section */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1,
                color: '#151515',
                fontSize: '0.9rem',
              }}
            >
              Select Delivery Location on Map
            </Typography>

            {/* Search Bar */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                inputRef={searchInputRef}
                placeholder="Search area, landmark or street..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: '#087F5B', fontSize: 20 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: '#FAFAF7',
                  },
                }}
              />
              <Button
                variant="outlined"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                sx={{
                  minWidth: 90,
                  borderColor: '#087F5B',
                  color: '#087F5B',
                  borderRadius: '12px',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#075B43',
                    backgroundColor: 'rgba(8, 127, 91, 0.05)',
                  },
                }}
              >
                {searching ? <CircularProgress size={18} /> : 'Search'}
              </Button>
              <Tooltip title="Use My Current Location">
                <Button
                  variant="contained"
                  onClick={getCurrentLocation}
                  disabled={locating}
                  sx={{
                    minWidth: 48,
                    width: 48,
                    p: 0,
                    backgroundColor: '#087F5B',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(8, 127, 91, 0.2)',
                    '&:hover': {
                      backgroundColor: '#075B43',
                    },
                  }}
                >
                  {locating ? <CircularProgress size={20} color="inherit" /> : <MyLocationIcon />}
                </Button>
              </Tooltip>
            </Box>

            {/* Google Map View */}
            <Box
              ref={mapRef}
              sx={{
                width: '100%',
                height: 280,
                borderRadius: '14px',
                border: '1.5px solid #E5E7EB',
                backgroundColor: '#F3F4F6',
                overflow: 'hidden',
              }}
            />
            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 0.8, color: '#6B7280', fontWeight: 500 }}
            >
              Click on the map or drag the pin marker to fine-tune your doorstep delivery pin.
            </Typography>
          </Box>

          {/* Form Fields */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Mobile Number"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleInputChange}
                required
                variant="outlined"
                inputProps={{ maxLength: 10 }}
                helperText="10-digit mobile number"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            size="small"
            label="Complete Delivery Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            multiline
            rows={2.5}
            variant="outlined"
            helperText="House/Flat no., Building name, Street, Landmark"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="City / Area"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                required
                variant="outlined"
                inputProps={{ maxLength: 6 }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                select
                label="Address Type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              >
                <MenuItem value="home">Home</MenuItem>
                <MenuItem value="work">Work</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    name="isDefault"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#087F5B',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#087F5B',
                      },
                    }}
                  />
                }
                label={<Typography sx={{ fontSize: '13px', fontWeight: 600 }}>Set as default address</Typography>}
              />
            </Grid>
          </Grid>

          {/* Coordinates Info */}
          {formData.latitude && formData.longitude && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: '10px',
                backgroundColor: '#F3F4F6',
                border: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="caption" sx={{ color: '#4B5563', fontWeight: 600 }}>
                Selected GPS Pin:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#087F5B', fontFamily: 'monospace' }}>
                {Number(formData.latitude).toFixed(5)}, {Number(formData.longitude).toFixed(5)}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #E5E7EB' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={submitting}
          sx={{
            borderColor: '#E5E7EB',
            color: '#6B7280',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            px: 2.5,
            '&:hover': {
              borderColor: '#9CA3AF',
              backgroundColor: '#FAFAF7',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{
            backgroundColor: '#087F5B',
            color: '#fff',
            fontWeight: 700,
            borderRadius: '12px',
            textTransform: 'none',
            minWidth: 140,
            px: 3,
            py: 1,
            boxShadow: '0 4px 12px rgba(8, 127, 91, 0.25)',
            '&:hover': {
              backgroundColor: '#075B43',
              boxShadow: '0 6px 16px rgba(8, 127, 91, 0.35)',
            },
          }}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : 'Save Address'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddressFormDialog;
