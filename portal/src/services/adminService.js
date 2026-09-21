import apiClient from '../api/apiClient';

const adminService = {
  // Get all admins
  getAllAdmins: async () => {
    return await apiClient.get('/admins');
  },

  // Get admin by ID
  getAdminById: async (id) => {
    return await apiClient.get(`/admins/${id}`);
  },

  // Add new admin
  createAdmin: async (data) => {
    return await apiClient.post('/admins', data);
  },
  addAdmin: async (data) => {
    return await apiClient.post('/admins', data);
  },

  // Update admin
  updateAdmin: async (id, data) => {
    return await apiClient.put(`/admins/${id}`, data);
  },

  // Delete admin
  deleteAdmin: async (id) => {
    return await apiClient.delete(`/admins/${id}`);
  },

  // Assign vendors to admin
  assignVendors: async (id, vendorIds) => {
    return await apiClient.post(`/admins/${id}/assign-vendors`, { vendor_ids: vendorIds });
  },

  // Remove vendors from admin
  removeVendors: async (id, vendorIds) => {
    return await apiClient.post(`/admins/${id}/remove-vendors`, { vendor_ids: vendorIds });
  },

  // Verify vendor
  verifyVendor: async (adminId, vendorId) => {
    return await apiClient.put(`/admins/${adminId}/verify-vendor/${vendorId}`);
  },

  // Admin login (if needed for portal)
  loginAdmin: async (credentials) => {
    return await apiClient.post('/login', credentials);
  }
};

export default adminService;
