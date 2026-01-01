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
  Autocomplete,
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
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Google Maps API Key
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

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
          lat: initialData.latitude,
          lng: initialData.longitude,
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

    return () => {
      // Cleanup if needed
    };
  }, [open]);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || !open || !mapRef.current) return;

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
      title: 'Delivery Location',
    });

    markerRef.current = marker;

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
  }, [mapLoaded, open]);

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
            latitude: lat,
            longitude: lng,
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

  // Search for location
  const handleSearch = async () => {
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
          latitude: lat,
          longitude: lng,
        }));

        if (markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
          markerRef.current.getMap().setCenter({ lat, lng });
        }

        reverseGeocode(lat, lng);
      } else {
        alert('Location not found. Please try a different search.');
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
    // Validate required fields
    if (!formData.name || !formData.mobile_number || !formData.pincode || !formData.address) {
      alert('Please fill all required fields');
      return;
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
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {initialData ? 'Edit Address' : 'Add New Address'}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#fff' }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3}>
          {/* Map Section */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1,
                color: 'text.secondary',
              }}
            >
              Select Location on Map
            </Typography>

            {/* Search Bar */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: '#667eea' }} />,
                }}
              />
              <Button
                variant="outlined"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                sx={{
                  minWidth: 100,
                  borderColor: '#667eea',
                  color: '#667eea',
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
              }}
            />
            <Typography
              variant="caption"
              sx={{ display: 'block', mt: 1, color: 'text.secondary' }}
            >
              Click on the map or drag the marker to select your delivery location
            </Typography>
          </Box>

          {/* Form Fields */}
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Mobile Number"
            name="mobile_number"
            value={formData.mobile_number}
            onChange={handleInputChange}
            required
            variant="outlined"
            inputProps={{ maxLength: 10 }}
            helperText="10-digit mobile number"
          />
          <TextField
            fullWidth
            label="Complete Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            required
            multiline
            rows={3}
            variant="outlined"
            helperText="House/Flat no., Building name, Street, Landmark"
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                required
                variant="outlined"
                inputProps={{ maxLength: 6 }}
              />
            </Grid>
          </Grid>
          <TextField
            fullWidth
            select
            label="Address Type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            variant="outlined"
          >
            <MenuItem value="home">Home</MenuItem>
            <MenuItem value="work">Work</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isDefault}
                onChange={handleInputChange}
                name="isDefault"
                color="primary"
              />
            }
            label="Set as default address"
          />

          {/* Coordinates Display */}
          {formData.latitude && formData.longitude && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f5f5f5',
                border: '1px solid #e0e0e0',
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Selected Coordinates:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={submitting}
          sx={{
            borderColor: '#e0e0e0',
            color: '#666',
            '&:hover': {
              borderColor: '#667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.05)',
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontWeight: 700,
            minWidth: 120,
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #653a8a 100%)',
            },
          }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Save Address'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddressFormDialog;
