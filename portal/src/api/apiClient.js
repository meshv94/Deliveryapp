// API Client for portal
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Get admin token from localStorage
    const token = localStorage.getItem('adminToken');

    const config = {
      ...options,
      headers: {
        ...options.headers,
      },
    };

    // Add Authorization header if token exists
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (!(options.body instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, clear token and redirect to login
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          window.location.href = '/login';
        }
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

export default new ApiClient();
