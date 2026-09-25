import apiClient from '../api/apiClient';

/**
 * Customer Notification Service API client
 */
const notificationService = {
  /**
   * Get paginated notifications for logged-in user
   * @param {number} page
   * @param {number} limit
   */
  getNotifications: async (page = 1, limit = 20) => {
    return await apiClient.get(`/app/notifications?page=${page}&limit=${limit}`);
  },

  /**
   * Mark a specific notification as read
   * @param {string} id
   */
  markAsRead: async (id) => {
    return await apiClient.put(`/app/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    return await apiClient.put('/app/notifications/read-all');
  },

  /**
   * Delete a notification
   * @param {string} id
   */
  deleteNotification: async (id) => {
    return await apiClient.delete(`/app/notifications/${id}`);
  },
};

export default notificationService;
