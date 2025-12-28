import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../services/api';

/**
 * Custom hook to fetch active vendors
 * @returns {Object} - { vendors, loading, error }
 */
export const useVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get moduleId from URL query params if present
        const moduleId = searchParams.get('moduleId');
        const url = moduleId
          ? `/app/vendors/active?moduleId=${moduleId}`
          : '/app/vendors/active';

        const response = await apiClient.get(url);
        
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
  }, [searchParams]);

  return { vendors, loading, error };
};

export default useVendors;
