import { useState, useEffect } from 'react';
import apiClient from '../services/api';

/**
 * Custom hook to fetch active vendors
 * @returns {Object} - { vendors, loading, error }
 */
export const useVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.get('/app/vendors/active');
        
        // Handle different response formats
        let vendorData = [];
        if (Array.isArray(response)) {
          vendorData = response;
        } else if (response?.data && Array.isArray(response.data)) {
          vendorData = response.data;
        } else if (response?.vendors && Array.isArray(response.vendors)) {
          vendorData = response.vendors;
        } else if (typeof response === 'object') {
          vendorData = [response];
        }

        // Validate and set vendors
        setVendors(Array.isArray(vendorData) ? vendorData : []);
      } catch (err) {
        console.error('Error fetching vendors:', err);
        setError(err.message || 'Failed to load vendors. Please try again.');
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  return { vendors, loading, error };
};

export default useVendors;
