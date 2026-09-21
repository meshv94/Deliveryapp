import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Grid,
  Switch,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
  Fade,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import HomeIcon from '@mui/icons-material/Home';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import WorkIcon from '@mui/icons-material/Work';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import PlaceIcon from '@mui/icons-material/Place';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// AapnuBazaar Brand Design Tokens
const BRAND = {
  green: '#087F5B',
  greenDark: '#075B43',
  greenLight: '#EBFBEE',
  greenBorder: 'rgba(8, 127, 91, 0.25)',
  orange: '#FF6B00',
  orangeTint: '#FFF4E6',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  borderFocus: '#087F5B',
  bgLight: '#F8FAFC',
  bgCard: '#FFFFFF',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  success: '#16A34A',
};

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

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null); // 'detected' | 'manual' | null

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Google Maps API Key from environment or fallback
  const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCpAhl9zWxIfigpQ17hkcgjHoKPNDP07pI';

  // Initialize or reset form state
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        mobile_number: initialData.mobile_number ? String(initialData.mobile_number).replace(/^\+91/, '') : '',
        pincode: initialData.pincode || '',
        address: initialData.address || '',
        city: initialData.city || '',
        type: initialData.type || 'home',
        isDefault: Boolean(initialData.isDefault),
        latitude: initialData.latitude ? Number(initialData.latitude) : null,
        longitude: initialData.longitude ? Number(initialData.longitude) : null,
      });

      if (initialData.latitude && initialData.longitude) {
        const coords = {
          lat: Number(initialData.latitude),
          lng: Number(initialData.longitude),
        };
        setCurrentLocation(coords);
        setLocationStatus('detected');
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
      setLocationStatus(null);
    }
    setErrors({});
    setTouched({});
    setSearchQuery('');
  }, [initialData, open]);

  // Load Google Maps Script with robust error handling
  useEffect(() => {
    if (!open) return;

    // Handle Google Maps Auth Failure event gracefully
    const originalAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.warn('Google Maps authentication failed - switching to graceful fallback mode.');
      setMapError(true);
      setMapLoaded(false);
      if (originalAuthFailure) originalAuthFailure();
    };

    if (window.google && window.google.maps && window.google.maps.places) {
      setMapLoaded(true);
      setMapError(false);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        setMapError(false);
        return;
      }
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
      setMapError(false);
    };
    script.onerror = () => {
      console.warn('Google Maps script failed to load. Using manual address entry.');
      setMapError(true);
      setMapLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      window.gm_authFailure = originalAuthFailure;
    };
  }, [open, GOOGLE_MAPS_API_KEY]);

  // Reverse Geocode to obtain address components from coordinates
  const reverseGeocode = useCallback(async (lat, lng) => {
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
              if (component.types.includes('locality') || component.types.includes('administrative_area_level_2')) {
                city = component.long_name;
              }
              if (component.types.includes('postal_code')) {
                pincode = component.long_name;
              }
            });

            setFormData((prev) => ({
              ...prev,
              address: prev.address || results[0].formatted_address,
              city: city || prev.city,
              pincode: pincode || prev.pincode,
              latitude: lat,
              longitude: lng,
            }));
            setLocationStatus('detected');
          }
        });
      }
    } catch (error) {
      console.warn('Reverse geocoding notice:', error);
    }
  }, []);

  // Request browser GPS location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus('manual');
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
        setLocationStatus('detected');

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
        console.warn('Geolocation unavailable:', error.message);
        // Fallback default coordinates if none set
        if (!currentLocation) {
          const fallback = { lat: 23.0225, lng: 72.5714 }; // Ahmedabad default
          setCurrentLocation(fallback);
          setFormData((prev) => ({
            ...prev,
            latitude: prev.latitude || fallback.lat,
            longitude: prev.longitude || fallback.lng,
          }));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [currentLocation, reverseGeocode]);

  // Initialize Map and Places Autocomplete
  useEffect(() => {
    if (!mapLoaded || !open || !mapRef.current || !window.google?.maps || mapError) return;

    try {
      const defaultCenter = currentLocation || { lat: 23.0225, lng: 72.5714 };

      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });
      mapInstanceRef.current = map;

      const marker = new window.google.maps.Marker({
        position: defaultCenter,
        map: map,
        draggable: true,
        title: 'Delivery Pin',
        animation: window.google.maps.Animation.DROP,
      });
      markerRef.current = marker;

      // Attach Places Autocomplete to Search Input
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
            if (c.types.includes('locality') || c.types.includes('administrative_area_level_2')) {
              city = c.long_name;
            }
            if (c.types.includes('postal_code')) {
              pincode = c.long_name;
            }
          });

          setFormData((prev) => ({
            ...prev,
            address: place.formatted_address || prev.address,
            city: city || prev.city,
            pincode: pincode || prev.pincode,
            latitude: lat,
            longitude: lng,
          }));
          setLocationStatus('detected');
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
        setLocationStatus('detected');
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
        setLocationStatus('detected');
        reverseGeocode(lat, lng);
      });

      // Automatically request location if adding a new address
      if (!initialData && !currentLocation) {
        getCurrentLocation();
      }
    } catch (err) {
      console.warn('Map initialization error:', err);
      setMapError(true);
    }
  }, [mapLoaded, open, mapError, initialData, getCurrentLocation, reverseGeocode]);

  // Search for location via Geocoder
  const handleSearch = () => {
    if (!searchQuery.trim()) return;

    if (!window.google?.maps?.Geocoder) {
      return;
    }

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
          if (c.types.includes('locality') || c.types.includes('administrative_area_level_2')) {
            city = c.long_name;
          }
          if (c.types.includes('postal_code')) {
            pincode = c.long_name;
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
        setLocationStatus('detected');
      } else {
        setErrors((prev) => ({
          ...prev,
          search: 'Location not found. Please try a different query or set on map.',
        }));
      }
    });
  };

  // Field validation rules
  const validateField = (name, value) => {
    let error = null;
    const trimmed = String(value || '').trim();

    switch (name) {
      case 'name':
        if (!trimmed) {
          error = 'Full name is required';
        } else if (trimmed.length < 2) {
          error = 'Name must be at least 2 characters';
        }
        break;
      case 'mobile_number':
        if (!trimmed) {
          error = 'Mobile number is required';
        } else if (!/^[6-9]\d{9}$/.test(trimmed)) {
          error = 'Please enter a valid 10-digit mobile number';
        }
        break;
      case 'address':
        if (!trimmed) {
          error = 'Delivery address is required';
        } else if (trimmed.length < 5) {
          error = 'Please provide complete house/street details';
        }
        break;
      case 'city':
        if (!trimmed) {
          error = 'City / Area is required';
        }
        break;
      case 'pincode':
        if (!trimmed) {
          error = 'Pincode is required';
        } else if (!/^\d{6}$/.test(trimmed)) {
          error = 'Enter a valid 6-digit pincode';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const validateAll = () => {
    const newErrors = {};
    const fields = ['name', 'mobile_number', 'address', 'city', 'pincode'];
    fields.forEach((field) => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });

    setErrors(newErrors);
    setTouched({
      name: true,
      mobile_number: true,
      address: true,
      city: true,
      pincode: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    const val = name === 'isDefault' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));

    if (touched[name]) {
      const error = validateField(name, val);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleTypeSelect = (type) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!validateAll()) {
      return;
    }

    // Persist active delivery address for smooth instant checkout
    try {
      localStorage.setItem(
        'activeDeliveryAddress',
        JSON.stringify({
          ...formData,
          displayLabel: formData.city ? `${formData.city}, ${formData.pincode}` : formData.address,
        })
      );
      if (formData.city) {
        localStorage.setItem('userCity', formData.city);
      }
      window.dispatchEvent(new Event('address_updated'));
    } catch (e) {
      console.warn('Storage event notice:', e);
    }

    onSubmit(formData);
  };

  const isEditMode = Boolean(initialData);

  return (
    <Dialog
      open={Boolean(open)}
      onClose={submitting ? undefined : onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: { xs: '20px 20px 0 0', sm: '24px' },
          maxHeight: { xs: '92vh', sm: '90vh' },
          margin: { xs: 0, sm: 2 },
          position: { xs: 'fixed', sm: 'relative' },
          bottom: { xs: 0, sm: 'auto' },
          width: { xs: '100%', sm: 'auto' },
          maxWidth: { sm: '760px' },
          backgroundColor: '#FFFFFF',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.16)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. MODAL HEADER (Sticky Top, Clean Brand Accents)
      ───────────────────────────────────────────────────────────── */}
      <DialogTitle
        sx={{
          p: { xs: 2.5, sm: 3 },
          pb: { xs: 2, sm: 2.5 },
          backgroundColor: '#FFFFFF',
          borderBottom: `1px solid ${BRAND.border}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              backgroundColor: BRAND.greenLight,
              color: BRAND.green,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(8, 127, 91, 0.12)',
              flexShrink: 0,
            }}
          >
            <LocationOnIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.15rem', sm: '1.3rem' },
                color: BRAND.textPrimary,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              {isEditMode ? 'Edit Address' : 'Add New Address'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: BRAND.textSecondary,
                fontSize: '0.84rem',
                mt: 0.3,
                fontWeight: 500,
              }}
            >
              {isEditMode
                ? 'Update your delivery details'
                : 'Add your delivery location for faster checkout'}
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          disabled={submitting}
          aria-label="Close dialog"
          sx={{
            color: BRAND.textSecondary,
            backgroundColor: BRAND.bgLight,
            border: `1px solid ${BRAND.border}`,
            borderRadius: '10px',
            p: 1,
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: '#F1F5F9',
              color: BRAND.textPrimary,
              borderColor: '#CBD5E1',
            },
          }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* ─────────────────────────────────────────────────────────────
          2. SCROLLABLE FORM CONTENT
      ───────────────────────────────────────────────────────────── */}
      <DialogContent
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          pt: { xs: 2.5, sm: 3 },
          backgroundColor: '#FFFFFF',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#F8FAFC',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#CBD5E1',
            borderRadius: '4px',
          },
        }}
      >
        <Stack spacing={3.5}>
          {/* ─────────────────────────────────────────────────────────────
              LOCATION / MAP SECTION
          ───────────────────────────────────────────────────────────── */}
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: '18px',
              backgroundColor: BRAND.bgLight,
              border: `1px solid ${BRAND.border}`,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
                mb: 1.8,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.98rem',
                    color: BRAND.textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.8,
                  }}
                >
                  <ExploreOutlinedIcon sx={{ color: BRAND.green, fontSize: 20 }} />
                  Delivery Location
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: BRAND.textSecondary, mt: 0.2 }}>
                  Pin your exact doorstep location or use GPS
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={getCurrentLocation}
                disabled={locating}
                startIcon={
                  locating ? (
                    <CircularProgress size={15} sx={{ color: BRAND.green }} />
                  ) : (
                    <MyLocationIcon sx={{ fontSize: '18px !important' }} />
                  )
                }
                sx={{
                  color: BRAND.green,
                  borderColor: BRAND.greenBorder,
                  backgroundColor: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  borderRadius: '10px',
                  px: 1.8,
                  py: 0.7,
                  textTransform: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  '&:hover': {
                    borderColor: BRAND.green,
                    backgroundColor: BRAND.greenLight,
                  },
                }}
              >
                {locating ? 'Detecting Location...' : 'Use Current Location'}
              </Button>
            </Box>

            {/* Search Bar for Places (if map active) */}
            {!mapError && (
              <Box sx={{ display: 'flex', gap: 1, mb: 1.8 }}>
                <TextField
                  fullWidth
                  size="small"
                  inputRef={searchInputRef}
                  placeholder="Search area, landmark, society or street..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (errors.search) setErrors((prev) => ({ ...prev, search: null }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: BRAND.green, fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.9rem',
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  sx={{
                    minWidth: 84,
                    backgroundColor: BRAND.green,
                    color: '#FFFFFF',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    boxShadow: 'none',
                    '&:hover': {
                      backgroundColor: BRAND.greenDark,
                    },
                  }}
                >
                  {searching ? <CircularProgress size={16} color="inherit" /> : 'Search'}
                </Button>
              </Box>
            )}

            {errors.search && (
              <Typography
                sx={{
                  color: BRAND.error,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  mb: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <ErrorOutlineIcon sx={{ fontSize: 16 }} /> {errors.search}
              </Typography>
            )}

            {/* Map View or Graceful Fallback */}
            {!mapError ? (
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: 250,
                  borderRadius: '14px',
                  border: `1.5px solid ${BRAND.border}`,
                  overflow: 'hidden',
                  backgroundColor: '#EDF2F7',
                }}
              >
                <Box ref={mapRef} sx={{ width: '100%', height: '100%' }} />

                {!mapLoaded && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(248, 250, 252, 0.85)',
                      backdropFilter: 'blur(4px)',
                      zIndex: 2,
                    }}
                  >
                    <Stack alignItems="center" spacing={1}>
                      <CircularProgress size={28} sx={{ color: BRAND.green }} />
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: BRAND.textSecondary }}>
                        Loading delivery map...
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Box>
            ) : (
              /* Graceful Fallback Card when Google Maps is unavailable */
              <Box
                sx={{
                  p: 3,
                  borderRadius: '14px',
                  border: `1px dashed ${BRAND.border}`,
                  backgroundColor: '#FFFFFF',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '14px',
                    backgroundColor: BRAND.greenLight,
                    color: BRAND.green,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                  }}
                >
                  <MapOutlinedIcon sx={{ fontSize: 28 }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: BRAND.textPrimary }}>
                  Location map preview unavailable
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.83rem',
                    color: BRAND.textSecondary,
                    maxWidth: 380,
                    mt: 0.5,
                    mb: 2,
                    lineHeight: 1.4,
                  }}
                >
                  You can use your device GPS location or simply type your full address details below.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={getCurrentLocation}
                  disabled={locating}
                  startIcon={
                    locating ? (
                      <CircularProgress size={16} sx={{ color: BRAND.green }} />
                    ) : (
                      <MyLocationIcon sx={{ fontSize: 18 }} />
                    )
                  }
                  sx={{
                    color: BRAND.green,
                    borderColor: BRAND.green,
                    borderRadius: '10px',
                    fontWeight: 700,
                    textTransform: 'none',
                    fontSize: '0.84rem',
                    px: 2.2,
                    py: 0.8,
                    '&:hover': {
                      backgroundColor: BRAND.greenLight,
                      borderColor: BRAND.greenDark,
                    },
                  }}
                >
                  {locating ? 'Detecting Location...' : 'Use Current Location'}
                </Button>
              </Box>
            )}

            {/* Location Status Confirmation Bar */}
            {formData.latitude && formData.longitude && (
              <Fade in>
                <Box
                  sx={{
                    mt: 1.5,
                    p: 1.2,
                    px: 1.8,
                    borderRadius: '10px',
                    backgroundColor: BRAND.greenLight,
                    border: `1px solid ${BRAND.greenBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon sx={{ color: BRAND.green, fontSize: 18 }} />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: BRAND.greenDark }}>
                      Delivery Pin Placed
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: BRAND.greenDark,
                      opacity: 0.85,
                    }}
                  >
                    Doorstep GPS Ready
                  </Typography>
                </Box>
              </Fade>
            )}
          </Box>

          {/* ─────────────────────────────────────────────────────────────
              ADDRESS DETAILS FORM
          ───────────────────────────────────────────────────────────── */}
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '1.05rem',
                color: BRAND.textPrimary,
                mb: 0.4,
                letterSpacing: '-0.01em',
              }}
            >
              Address Details
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: BRAND.textSecondary, mb: 2.5 }}>
              Please provide precise contact and delivery destination info
            </Typography>

            <Grid container spacing={2.2}>
              {/* Full Name */}
              <Grid item xs={12} sm={6}>
                <Typography
                  component="label"
                  htmlFor="address-fullname"
                  sx={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: BRAND.textPrimary,
                    mb: 0.7,
                  }}
                >
                  Full Name <span style={{ color: BRAND.error }}>*</span>
                </Typography>
                <TextField
                  id="address-fullname"
                  fullWidth
                  size="small"
                  placeholder="e.g. Meshv Patel"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('name')}
                  error={Boolean(touched.name && errors.name)}
                  helperText={touched.name && errors.name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon
                          sx={{
                            color: touched.name && errors.name ? BRAND.error : BRAND.textSecondary,
                            fontSize: 20,
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.92rem',
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(8, 127, 91, 0.12)',
                      },
                    },
                  }}
                />
              </Grid>

              {/* Mobile Number */}
              <Grid item xs={12} sm={6}>
                <Typography
                  component="label"
                  htmlFor="address-mobile"
                  sx={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: BRAND.textPrimary,
                    mb: 0.7,
                  }}
                >
                  Mobile Number <span style={{ color: BRAND.error }}>*</span>
                </Typography>
                <TextField
                  id="address-mobile"
                  fullWidth
                  size="small"
                  placeholder="98XXXXXXXX"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('mobile_number')}
                  error={Boolean(touched.mobile_number && errors.mobile_number)}
                  helperText={
                    (touched.mobile_number && errors.mobile_number) || '10-digit number for delivery updates'
                  }
                  inputProps={{ maxLength: 10 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneOutlinedIcon
                            sx={{
                              color:
                                touched.mobile_number && errors.mobile_number
                                  ? BRAND.error
                                  : BRAND.textSecondary,
                              fontSize: 18,
                            }}
                          />
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: BRAND.textPrimary }}>
                            +91
                          </Typography>
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.92rem',
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(8, 127, 91, 0.12)',
                      },
                    },
                  }}
                />
              </Grid>

              {/* Complete Address */}
              <Grid item xs={12}>
                <Typography
                  component="label"
                  htmlFor="address-complete"
                  sx={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: BRAND.textPrimary,
                    mb: 0.7,
                  }}
                >
                  Complete Delivery Address <span style={{ color: BRAND.error }}>*</span>
                </Typography>
                <TextField
                  id="address-complete"
                  fullWidth
                  size="small"
                  placeholder="Flat / House / Building no., Apartment name, Street, Landmark"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('address')}
                  error={Boolean(touched.address && errors.address)}
                  helperText={
                    (touched.address && errors.address) ||
                    'Detailed address ensures our delivery partner reaches quickly'
                  }
                  multiline
                  rows={2.5}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.92rem',
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(8, 127, 91, 0.12)',
                      },
                    },
                  }}
                />
              </Grid>

              {/* City / Area */}
              <Grid item xs={12} sm={6}>
                <Typography
                  component="label"
                  htmlFor="address-city"
                  sx={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: BRAND.textPrimary,
                    mb: 0.7,
                  }}
                >
                  City / Area <span style={{ color: BRAND.error }}>*</span>
                </Typography>
                <TextField
                  id="address-city"
                  fullWidth
                  size="small"
                  placeholder="e.g. Ahmedabad"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('city')}
                  error={Boolean(touched.city && errors.city)}
                  helperText={touched.city && errors.city}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.92rem',
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(8, 127, 91, 0.12)',
                      },
                    },
                  }}
                />
              </Grid>

              {/* Pincode */}
              <Grid item xs={12} sm={6}>
                <Typography
                  component="label"
                  htmlFor="address-pincode"
                  sx={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: BRAND.textPrimary,
                    mb: 0.7,
                  }}
                >
                  Pincode <span style={{ color: BRAND.error }}>*</span>
                </Typography>
                <TextField
                  id="address-pincode"
                  fullWidth
                  size="small"
                  placeholder="e.g. 380001"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('pincode')}
                  error={Boolean(touched.pincode && errors.pincode)}
                  helperText={touched.pincode && errors.pincode}
                  inputProps={{ maxLength: 6 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#FFFFFF',
                      fontSize: '0.92rem',
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(8, 127, 91, 0.12)',
                      },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* ─────────────────────────────────────────────────────────────
              4. ADDRESS TYPE SELECTOR ("Save address as")
          ───────────────────────────────────────────────────────────── */}
          <Box>
            <Typography
              sx={{
                fontSize: '0.85rem',
                fontWeight: 700,
                color: BRAND.textPrimary,
                mb: 1.2,
              }}
            >
              Save address as
            </Typography>

            <Grid container spacing={1.5}>
              {[
                {
                  id: 'home',
                  label: 'Home',
                  desc: 'All-day delivery',
                  icon: formData.type === 'home' ? <HomeIcon /> : <HomeOutlinedIcon />,
                },
                {
                  id: 'work',
                  label: 'Work',
                  desc: 'Delivery 9AM - 6PM',
                  icon: formData.type === 'work' ? <WorkIcon /> : <WorkOutlineIcon />,
                },
                {
                  id: 'other',
                  label: 'Other',
                  desc: 'Friends / Family',
                  icon: formData.type === 'other' ? <PlaceIcon /> : <PlaceOutlinedIcon />,
                },
              ].map((item) => {
                const isSelected = formData.type === item.id;
                return (
                  <Grid item xs={4} key={item.id}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => handleTypeSelect(item.id)}
                      sx={{
                        width: '100%',
                        p: { xs: 1.2, sm: 1.6 },
                        borderRadius: '14px',
                        border: isSelected ? `2px solid ${BRAND.green}` : `1.5px solid ${BRAND.border}`,
                        backgroundColor: isSelected ? BRAND.greenLight : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        outline: 'none',
                        '&:hover': {
                          borderColor: isSelected ? BRAND.green : '#94A3B8',
                          backgroundColor: isSelected ? BRAND.greenLight : BRAND.bgLight,
                          transform: 'translateY(-1px)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          color: isSelected ? BRAND.green : BRAND.textSecondary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: isSelected ? BRAND.greenDark : BRAND.textPrimary,
                        }}
                      >
                        {item.label}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {/* ─────────────────────────────────────────────────────────────
              5. DEFAULT ADDRESS TOGGLE
          ───────────────────────────────────────────────────────────── */}
          <Box
            sx={{
              p: 2,
              px: 2.2,
              borderRadius: '14px',
              border: `1.5px solid ${formData.isDefault ? BRAND.greenBorder : BRAND.border}`,
              backgroundColor: formData.isDefault ? BRAND.greenLight : BRAND.bgLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() =>
              setFormData((prev) => ({ ...prev, isDefault: !prev.isDefault }))
            }
          >
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: BRAND.textPrimary }}>
                Set as default delivery address
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: BRAND.textSecondary, mt: 0.2 }}>
                Use this address automatically at checkout
              </Typography>
            </Box>
            <Switch
              checked={formData.isDefault}
              onChange={handleInputChange}
              name="isDefault"
              onClick={(e) => e.stopPropagation()}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: BRAND.green,
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: BRAND.green,
                },
              }}
            />
          </Box>
        </Stack>
      </DialogContent>

      {/* ─────────────────────────────────────────────────────────────
          6. STICKY FOOTER / ACTION BAR
      ───────────────────────────────────────────────────────────── */}
      <DialogActions
        sx={{
          p: { xs: 2, sm: 2.5 },
          px: { xs: 2.5, sm: 3.5 },
          backgroundColor: '#FFFFFF',
          borderTop: `1px solid ${BRAND.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={submitting}
          sx={{
            borderColor: BRAND.border,
            color: BRAND.textSecondary,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.92rem',
            px: { xs: 2.5, sm: 3 },
            py: 1.1,
            '&:hover': {
              borderColor: '#94A3B8',
              backgroundColor: BRAND.bgLight,
              color: BRAND.textPrimary,
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
            backgroundColor: BRAND.green,
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.95rem',
            borderRadius: '12px',
            textTransform: 'none',
            minWidth: { xs: 150, sm: 180 },
            px: 3.5,
            py: 1.15,
            boxShadow: '0 4px 14px rgba(8, 127, 91, 0.28)',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: BRAND.greenDark,
              boxShadow: '0 6px 18px rgba(8, 127, 91, 0.38)',
              transform: 'translateY(-1px)',
            },
            '&:disabled': {
              backgroundColor: '#94A3B8',
              color: '#FFFFFF',
            },
          }}
        >
          {submitting ? (
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircularProgress size={18} thickness={5} sx={{ color: '#FFFFFF' }} />
              <span>Saving...</span>
            </Stack>
          ) : isEditMode ? (
            'Update Address'
          ) : (
            'Save Address'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddressFormDialog;
