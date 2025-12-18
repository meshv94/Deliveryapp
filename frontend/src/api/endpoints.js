import apiClient from './apiClient';

// User API calls
export const userAPI = {
  register: (userData) => apiClient.post('/users/register', userData),
  login: (credentials) => apiClient.post('/users/login', credentials),
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (userData) => apiClient.put('/users/profile', userData),
  logout: () => apiClient.post('/users/logout'),
};

// Vendor API calls
export const vendorAPI = {
  getAll: () => apiClient.get('/vendors'),
  getById: (id) => apiClient.get(`/vendors/${id}`),
  create: (vendorData) => apiClient.post('/vendors', vendorData),
  update: (id, vendorData) => apiClient.put(`/vendors/${id}`, vendorData),
  delete: (id) => apiClient.delete(`/vendors/${id}`),
};

// Product API calls
export const productAPI = {
  getAll: (params) => apiClient.get('/products', { params }),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (productData) => apiClient.post('/products', productData),
  update: (id, productData) => apiClient.put(`/products/${id}`, productData),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

// Cart API calls
export const cartAPI = {
  getCart: () => apiClient.get('/cart'),
  addToCart: (cartData) => apiClient.post('/cart', cartData),
  updateCartItem: (itemId, quantity) => apiClient.put(`/cart/${itemId}`, { quantity }),
  removeFromCart: (itemId) => apiClient.delete(`/cart/${itemId}`),
  clearCart: () => apiClient.delete('/cart'),
};

// Order API calls
export const orderAPI = {
  getAll: () => apiClient.get('/orders'),
  getById: (id) => apiClient.get(`/orders/${id}`),
  create: (orderData) => apiClient.post('/orders', orderData),
  update: (id, orderData) => apiClient.put(`/orders/${id}`, orderData),
  cancel: (id) => apiClient.delete(`/orders/${id}`),
};

// Address API calls
export const addressAPI = {
  getAll: () => apiClient.get('/addresses'),
  getById: (id) => apiClient.get(`/addresses/${id}`),
  create: (addressData) => apiClient.post('/addresses', addressData),
  update: (id, addressData) => apiClient.put(`/addresses/${id}`, addressData),
  delete: (id) => apiClient.delete(`/addresses/${id}`),
};

// Module API calls (Admin)
export const moduleAPI = {
  getAll: () => apiClient.get('/admin/modules'),
  getById: (id) => apiClient.get(`/admin/modules/${id}`),
  create: (moduleData) => apiClient.post('/admin/modules', moduleData),
  update: (id, moduleData) => apiClient.put(`/admin/modules/${id}`, moduleData),
  delete: (id) => apiClient.delete(`/admin/modules/${id}`),
};

export default apiClient;
