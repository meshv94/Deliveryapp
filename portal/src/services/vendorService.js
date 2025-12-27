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

  // Product Management APIs
  // Get all products for a specific vendor
  getProductsByVendor: async (vendorId) => {
    return await apiClient.get(`/vendors/${vendorId}/products`);
  },

  // Get all products
  getAllProducts: async () => {
    return await apiClient.get('/products');
  },

  // Get product by ID
  getProductById: async (productId) => {
    return await apiClient.get(`/products/${productId}`);
  },

  // Create new product
  createProduct: async (formData) => {
    return await apiClient.post('/products', formData);
  },

  // Update product
  updateProduct: async (productId, formData) => {
    return await apiClient.put(`/products/${productId}`, formData);
  },

  // Delete product
  deleteProduct: async (productId) => {
    return await apiClient.delete(`/products/${productId}`);
  },
};

export default vendorService;
