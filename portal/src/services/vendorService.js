import apiClient from '../api/apiClient';

const vendorService = {
  // Get all vendors
  getAllVendors: async () => {
    return await apiClient.get('/vendors');
  },

  // Get vendor by ID
  getVendorById: async (id) => {
    return await apiClient.get(`/vendors/${id}`);
  },

  // Create new vendor
  createVendor: async (formData) => {
    return await apiClient.post('/vendors', formData);
  },

  // Update vendor
  updateVendor: async (id, formData) => {
    return await apiClient.put(`/vendors/${id}`, formData);
  },

  // Delete vendor
  deleteVendor: async (id) => {
    return await apiClient.delete(`/vendors/${id}`);
  },
};

export default vendorService;
