import apiClient from '../api/apiClient';

const moduleService = {
  // Get all modules
  getAllModules: async () => {
    return await apiClient.get('/modules');
  },

  // Get active modules
  getActiveModules: async () => {
    return await apiClient.get('/modules/active/list');
  },

  // Get inactive modules
  getInactiveModules: async () => {
    return await apiClient.get('/modules/inactive/list');
  },

  // Get module by ID
  getModuleById: async (id) => {
    return await apiClient.get(`/modules/${id}`);
  },

  // Create new module
  createModule: async (data) => {
    return await apiClient.post('/modules', data);
  },

  // Update module
  updateModule: async (id, data) => {
    return await apiClient.put(`/modules/${id}`, data);
  },

  // Delete module
  deleteModule: async (id) => {
    return await apiClient.delete(`/modules/${id}`);
  },
};

export default moduleService;
