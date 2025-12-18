import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Custom hook for fetching vendor details and products
 * @param {string} vendorId - The vendor ID from URL params
 * @returns {object} { vendor, products, loading, error }
 */
const useVendorDetails = (vendorId) => {
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vendorId) {
      setError('Vendor ID not provided');
      setLoading(false);
      return;
    }

    const fetchVendorDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get token from localStorage
        const token = localStorage.getItem('authToken') || 'http://localhost:5000/api';

        // Call API
        const response = await axios.get(
          `${API_BASE_URL}/app/vendors/products/?vendor_id=${vendorId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Handle different response formats
        if (response.data?.success) {
          const data = response.data.data || {};
          setVendor(data.vendor || null);

          // Filter active products
          const activeProducts = (data.products || []).filter(
            (product) => product.isActive !== false
          );
          setProducts(activeProducts);
        } else {
          setError('Invalid response format from server');
        }
      } catch (err) {
        console.error('Error fetching vendor details:', err);
        const message =
          err.response?.data?.message ||
          err.message ||
          'Failed to load vendor details. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorDetails();
  }, [vendorId]);

  return { vendor, products, loading, error };
};

export default useVendorDetails;
