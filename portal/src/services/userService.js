import apiClient from '../api/apiClient';

const userService = {
  // Get all users
  getAllUsers: async () => {
    return await apiClient.get('/users');
  },

  // Get user by ID
  getUserById: async (id) => {
    return await apiClient.get(`/users/${id}`);
  },

  // Update user
  updateUser: async (id, data) => {
    return await apiClient.put(`/users/${id}`, data);
  },

  // Delete user
  deleteUser: async (id) => {
    return await apiClient.delete(`/users/${id}`);
  },

  // Toggle block status
  toggleBlockUser: async (id) => {
    return await apiClient.put(`/users/${id}/toggle-block`, {});
  },

  // Get user statistics
  getUserStats: async () => {
    return await apiClient.get('/users/stats');
  }
};

export default userService;
